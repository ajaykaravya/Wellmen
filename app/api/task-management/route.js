import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import {
  buildInFilter,
  findIdsByColumnContains,
  findIdsByMultiTableSearch,
} from "@/lib/mysql-search";
import {
  ensureEndDateIsValid,
  isAdminRole,
  parseDate,
  parseProjectId,
  parseStatus,
  serializeTodo,
  resolveCompletedDate,
  validateCategoryForType,
} from "./_shared";

const buildListWhere = async ({ searchParams, userId, isAdmin }) => {
  const q = String(searchParams.get("q") || "").trim();
  const status = parseStatus(searchParams.get("status"));
  const date = searchParams.get("date");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const assigneeId = String(searchParams.get("assigneeId") || "").trim();
  const projectId = parseProjectId(searchParams.get("projectId"));
  const type = String(searchParams.get("type") || "").trim();
  const priority = String(searchParams.get("priority") || "").trim();
  const categoryId = String(searchParams.get("categoryId") || "").trim();
  const category = String(searchParams.get("category") || "").trim();
  const includePendingOld = searchParams.get("includePendingOld") === "true";

  const where = {};
  const andConditions = [];

  if (!isAdmin) {
    andConditions.push({
      OR: [{ createdById: userId }, { assigneeId: userId }],
    });
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  if (q) {
    andConditions.push(
      buildInFilter(
        "id",
        await findIdsByMultiTableSearch({
          rootTable: "Todo",
          query: q,
          joins: [
            {
              alias: "category",
              table: "Categories",
              left: { alias: "root", column: "categoryId" },
              right: { column: "id" },
            },
          ],
          orSearch: [
            { alias: "root", column: "description" },
            { alias: "category", column: "name" },
          ],
        }),
      ),
    );
  }

  if (status) {
    andConditions.push({ status });
  }

  if (projectId) {
    andConditions.push({ projectId });
  }

  if (type) {
    andConditions.push({ type });
  }

  if (priority) {
    andConditions.push({ priority: priority.toUpperCase() });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (category) {
    andConditions.push(
      buildInFilter(
        "categoryId",
        await findIdsByColumnContains("Categories", "name", category),
      ),
    );
  }

  const parsedFromDate = parseDate(fromDate);
  const parsedToDate = parseDate(toDate);
  if (fromDate && !parsedFromDate) {
    return {
      error: NextResponse.json({ error: "Invalid fromDate." }, { status: 400 }),
    };
  }
  if (toDate && !parsedToDate) {
    return {
      error: NextResponse.json({ error: "Invalid toDate." }, { status: 400 }),
    };
  }

  if (includePendingOld) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    andConditions.push({
      OR: [
        {
          status: {
            not: "COMPLETED",
          },
        },
        {
          completedDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      ],
    });
  } else if (parsedFromDate || parsedToDate) {
    const startDateWhere = {};
    if (parsedFromDate) {
      startDateWhere.gte = parsedFromDate;
    }
    if (parsedToDate) {
      const end = new Date(parsedToDate);
      end.setHours(23, 59, 59, 999);
      startDateWhere.lte = end;
    }
    andConditions.push({ startDate: startDateWhere });
  } else if (date) {
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) {
      return {
        error: NextResponse.json({ error: "Invalid date." }, { status: 400 }),
      };
    }

    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    andConditions.push({
      startDate: {
        gte: start,
        lt: end,
      },
    });
  }

  if (andConditions.length) {
    where.AND = andConditions;
  }

  return { where };
};

const buildTodoInclude = {
  assignee: { include: { role: true } },
  project: { select: { id: true, name: true, city: true } },
  category: { select: { id: true, name: true, category: true } },
};

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id || "";
  const isAdmin = isAdminRole(gate.auth);
  const searchParams = new URL(req.url).searchParams;
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const page =
    pageParam && Number.isFinite(Number(pageParam)) ? Number(pageParam) : null;

  const pageSize =
    pageSizeParam && Number.isFinite(Number(pageSizeParam))
      ? Math.min(Number(pageSizeParam), 100)
      : null;

  const listWhere = await buildListWhere({ searchParams, userId, isAdmin });
  if (listWhere.error) return listWhere.error;

  const where = listWhere.where;

  const [total, todos] = await Promise.all([
    prisma.todo.count({ where }),
    prisma.todo.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: buildTodoInclude,
      ...(page && pageSize
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    }),
  ]);

  const data = todos.map((todo) => serializeTodo(todo, userId));

  return NextResponse.json({
    data,
    page,
    pageSize,
    total,
    totalPages: page && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  });
}

export async function POST(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const isAdmin = isAdminRole(gate.auth);
  const userId = gate.auth?.user?.id || null;
  const body = await req.json();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const status = parseStatus(body.status) || "TODO";
  const assigneeId = isAdmin ? String(body.assigneeId || "").trim() : userId;
  const projectId = parseProjectId(body.projectId);
  const type = String(body.type || "")
    .trim()
    .toUpperCase();
  const priority = String(body.priority || "medium").toUpperCase();
  const categoryId = String(body.categoryId || "").trim();
  const subCategory = String(body.subCategory || "").trim();

  if (!startDate) {
    return NextResponse.json(
      { error: "Start date is required." },
      { status: 400 },
    );
  }

  if (!type) {
    return NextResponse.json(
      { error: "Task type is required." },
      { status: 400 },
    );
  }

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 },
    );
  }

  if (isAdmin && !assigneeId) {
    return NextResponse.json(
      { error: "Assignee is required." },
      { status: 400 },
    );
  }

  if (type === "SERVICE" && !subCategory) {
    return NextResponse.json(
      { error: "Sub category is required for service tasks." },
      { status: 400 },
    );
  }

  if (categoryId) {
    const categoryCheck = await validateCategoryForType(type, categoryId);
    if (!categoryCheck.ok) {
      return NextResponse.json({ error: categoryCheck.error }, { status: 400 });
    }
  }

  const completedDate = resolveCompletedDate(null, status);

  const parsedStartDate = parseDate(startDate);
  if (!parsedStartDate) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }

  const parsedEndDate = endDate ? parseDate(endDate) : null;
  if (endDate && !parsedEndDate) {
    return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
  }
  const endDateError = ensureEndDateIsValid(parsedStartDate, parsedEndDate);
  if (endDateError) {
    return NextResponse.json({ error: endDateError }, { status: 400 });
  }

  if (isAdmin && assigneeId) {
    const exists = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!exists) {
      return NextResponse.json(
        { error: "Assignee not found." },
        { status: 400 },
      );
    }
  }

  if (projectId) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 400 },
      );
    }
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        description: description || null,
        comments: comments || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate || null,
        completedDate,
        status,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        createdById: userId,
        type,
        priority,
        categoryId,
        subCategory: type === "SERVICE" ? subCategory : null,
      },
      include: buildTodoInclude,
    });

    return NextResponse.json(serializeTodo(todo, userId), { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the task." },
      { status: 500 },
    );
  }
}
