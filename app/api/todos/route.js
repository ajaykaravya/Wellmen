import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TODO") return "TODO";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "ON_HOLD") return "ON_HOLD";

  return null;
};

const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parseProjectId = (value) => String(value || "").trim();
const taskTypeToCategory = {
  PROJECT: "PROJECT_WORK",
  OFFICE: "OFFICE_WORK",
  SERVICE: "SERVICE_WORK",
};

const validateCategoryForType = async (type, categoryId) => {
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { ok: false, error: "Category not found." };
  }

  const expectedCategory = taskTypeToCategory[type];
  if (expectedCategory && category.category !== expectedCategory) {
    return {
      ok: false,
      error: "Category does not match the selected task type.",
    };
  }

  return { ok: true, category };
};

const ensureEndDateIsValid = (startDate, endDate) => {
  if (endDate && endDate < startDate) {
    return "End date cannot be earlier than start date.";
  }
  return null;
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
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
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const includePendingOld = searchParams.get("includePendingOld") === "true";
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {};

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (assigneeId) {
    where.assigneeId = assigneeId;
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
    return NextResponse.json({ error: "Invalid fromDate." }, { status: 400 });
  }
  if (toDate && !parsedToDate) {
    return NextResponse.json({ error: "Invalid toDate." }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (includePendingOld) {
    where.OR = [
      {
        // ✅ Today's tasks
        startDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      {
        // ✅ Old tasks NOT completed
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
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    where.startDate = {
      gte: start,
      lt: end,
    };
  }

  const [total, todos] = await Promise.all([
    prisma.todo.count({ where }),
    prisma.todo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { include: { role: true } },
        project: { select: { id: true, name: true, city: true } },
        category: { select: { id: true, name: true, category: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = todos.map((todo) => ({
    id: todo.id,
    description: todo.description,
    startDate: todo.startDate,
    endDate: todo.endDate || null,
    status: todo.status,
    projectId: todo.projectId,
    projectName: todo.project?.name || "-",
    projectCity: todo.project?.city || null,
    comments: todo.comments,
    type: todo.type,
    priority: todo.priority,
    categoryId: todo.categoryId,
    categoryName: todo.category?.name || "-",
    categoryType: todo.category?.category || null,
    category: todo.category
      ? {
          id: todo.category.id,
          name: todo.category.name,
          category: todo.category.category,
        }
      : null,
    subCategory: todo.subCategory || null,
    assignee: todo.assignee
      ? {
          id: todo.assignee.id,
          firstName: todo.assignee.firstName,
          lastName: todo.assignee.lastName,
          mobileNumber: todo.assignee.mobileNumber,
          role: todo.assignee.role?.name || null,
        }
      : null,
    createdAt: todo.createdAt,
  }));

  return NextResponse.json({
    data,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const status = parseStatus(body.status) || "TODO";
  const assigneeId = String(body.assigneeId || "").trim();
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

  if (!assigneeId) {
    return NextResponse.json(
      { error: "Assignee is required." },
      { status: 400 },
    );
  }

  if (!status) {
    return NextResponse.json({ error: "Status is required." }, { status: 400 });
  }

  if (type === "service" && !subCategory) {
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

  if (assigneeId) {
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
        createdById: gate.auth?.user?.id || null,
        type,
        priority,
        categoryId,
        subCategory: type === "SERVICE" ? subCategory : null,
      },
      include: {
        assignee: { include: { role: true } },
        project: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, category: true } },
      },
    });
    return NextResponse.json(
      {
        id: todo.id,
        description: todo.description,
        comments: todo.comments,
        startDate: todo.startDate,
        status: todo.status,
        projectId: todo.projectId,
        projectName: todo.project?.name || "-",
        type: todo.type,
        priority: todo.priority,
        categoryId: todo.categoryId,
        categoryName: todo.category?.name || "-",
        categoryType: todo.category?.category || null,
        subCategory: todo.subCategory,
        assignee: todo.assignee
          ? {
              id: todo.assignee.id,
              firstName: todo.assignee.firstName,
              lastName: todo.assignee.lastName,
              mobileNumber: todo.assignee.mobileNumber,
              role: todo.assignee.role?.name || null,
            }
          : null,
        createdAt: todo.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the task." },
      { status: 500 },
    );
  }
}
