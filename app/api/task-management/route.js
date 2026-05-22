import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import {
  ensureEndDateIsValid,
  isAdminRole,
  parseDate,
  parseProjectId,
  parseStatus,
  serializeTodo,
  validateCategoryForType,
} from "./_shared";

const buildListWhere = ({ searchParams, userId, isAdmin }) => {
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

  if (!isAdmin) {
    where.assigneeId = userId || undefined;
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (type) {
    where.type = type;
  }

  if (priority) {
    where.priority = priority.toUpperCase();
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (category) {
    where.category = {
      name: { contains: category, mode: "insensitive" },
    };
  }

  const parsedFromDate = parseDate(fromDate);
  const parsedToDate = parseDate(toDate);
  if (fromDate && !parsedFromDate) {
    return { error: NextResponse.json({ error: "Invalid fromDate." }, { status: 400 }) };
  }
  if (toDate && !parsedToDate) {
    return { error: NextResponse.json({ error: "Invalid toDate." }, { status: 400 }) };
  }

  if (isAdmin && includePendingOld) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    where.OR = [
      {
        startDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      {
        AND: [
          {
            startDate: {
              lt: todayStart,
            },
          },
          {
            status: {
              not: "COMPLETED",
            },
          },
        ],
      },
    ];
  } else if (parsedFromDate || parsedToDate) {
    where.startDate = {};
    if (parsedFromDate) {
      where.startDate.gte = parsedFromDate;
    }
    if (parsedToDate) {
      const end = new Date(parsedToDate);
      end.setHours(23, 59, 59, 999);
      where.startDate.lte = end;
    }
  } else if (date) {
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) {
      return { error: NextResponse.json({ error: "Invalid date." }, { status: 400 }) };
    }

    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    where.startDate = {
      gte: start,
      lt: end,
    };
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
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const listWhere = buildListWhere({ searchParams, userId, isAdmin });
  if (listWhere.error) return listWhere.error;

  const where = listWhere.where;

  const [total, todos] = await Promise.all([
    prisma.todo.count({ where }),
    prisma.todo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: buildTodoInclude,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = todos.map((todo) => serializeTodo(todo, userId));

  return NextResponse.json({
    data,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
