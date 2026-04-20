import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

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
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
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

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Todo id is required." },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: {
      assignee: { include: { role: true } },
      project: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, category: true } },
    },
  });

  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: todo.id,
    description: todo.description,
    comments: todo.comments,
    startDate: todo.startDate,
    endDate: todo.endDate || null,
    status: todo.status,
    projectId: todo.projectId,
    projectName: todo.project?.name || "-",
    assigneeId: todo.assigneeId,
    type: todo.type,
    priority: todo.priority,
    categoryId: todo.categoryId,
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
  });
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Todo id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const status = parseStatus(body.status);
  const assigneeId = String(body.assigneeId || "").trim();
  const projectId = parseProjectId(body.projectId);
  const type = String(body.type || "")
    .trim()
    .toUpperCase();
  const priority = String(body.priority || "MEDIUM").toUpperCase();
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

  if (type === "SERVICE" && !subCategory) {
    return NextResponse.json(
      { error: "Sub category is required for service tasks." },
      { status: 400 },
    );
  }

  if (categoryId) {
    const categoryCheck = await validateCategoryForType(type, categoryId);
    if (!categoryCheck.ok) {
      return NextResponse.json(
        { error: categoryCheck.error },
        { status: 400 },
      );
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

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      description: description || null,
      comments: comments || null,
      startDate: parsedStartDate,
      endDate: parsedEndDate || null,
      status: status || "TODO",
      projectId: projectId || null,
      assigneeId: assigneeId || null,
      type,
      priority,
      categoryId,
      subCategory: subCategory || null,
    },
    include: {
      assignee: { include: { role: true } },
      project: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
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
    category: todo.category
      ? {
          id: todo.category.id,
          name: todo.category.name,
          category: todo.category.category,
        }
      : null,
    subCategory: todo.subCategory,
    assigneeId: todo.assigneeId,
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
  });
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Todo id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
