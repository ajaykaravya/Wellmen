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
  resolveCompletedDate,
  validateCategoryForType,
} from "../_shared";

const resolveId = async (params) => String((await params)?.id || "").trim();

const buildTodoInclude = {
  assignee: { include: { role: true } },
  project: { select: { id: true, name: true, city: true } },
  category: { select: { id: true, name: true, category: true } },
};

async function loadAllowedTodo(req, params) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate;

  const id = await resolveId(params);
  if (!id) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Todo id is required." },
        { status: 400 },
      ),
    };
  }

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: buildTodoInclude,
  });

  if (!todo) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Todo not found." }, { status: 404 }),
    };
  }

  const isAdmin = isAdminRole(gate.auth);
  const userId = gate.auth?.user?.id || "";
  const canRead = todo.assigneeId === userId;
  const canManage = todo.createdById === userId;

  if (!isAdmin && !canRead) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true, gate, todo, isAdmin, userId, canManage };
}

export async function GET(req, { params }) {
  const loaded = await loadAllowedTodo(req, params);
  if (!loaded.ok) return loaded.res;

  return NextResponse.json(serializeTodo(loaded.todo, loaded.userId));
}

export async function PUT(req, { params }) {
  const loaded = await loadAllowedTodo(req, params);
  if (!loaded.ok) return loaded.res;

  if (!loaded.isAdmin && !loaded.canManage) {
    return NextResponse.json(
      { error: "You can only modify todos created by you." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const status = parseStatus(body.status) || "TODO";
  const assigneeId = loaded.isAdmin ? String(body.assigneeId || "").trim() : "";
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
      return NextResponse.json({ error: categoryCheck.error }, { status: 400 });
    }
  }

  const completedDate = resolveCompletedDate(loaded.todo, status);

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

  if (loaded.isAdmin && assigneeId) {
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
    where: { id: loaded.todo.id },
    data: {
      description: description || null,
      comments: comments || null,
      startDate: parsedStartDate,
      endDate: parsedEndDate || null,
      completedDate,
      status,
      projectId: projectId || null,
      assigneeId: loaded.isAdmin ? assigneeId || null : loaded.todo.assigneeId,
      type,
      priority,
      categoryId,
      subCategory: type === "SERVICE" ? subCategory : null,
    },
    include: buildTodoInclude,
  });

  return NextResponse.json(serializeTodo(todo, loaded.userId));
}

export async function PATCH(req, { params }) {
  const loaded = await loadAllowedTodo(req, params);
  if (!loaded.ok) return loaded.res;

  const body = await req.json();
  const isLimitedUser = !loaded.isAdmin && !loaded.canManage;

  if (isLimitedUser) {
    const triedRestrictedField =
      typeof body.description === "string" ||
      typeof body.startDate === "string" ||
      typeof body.projectId === "string";

    if (triedRestrictedField) {
      return NextResponse.json(
        { error: "You can only update status and comments for this todo." },
        { status: 403 },
      );
    }
  }

  const comments =
    typeof body.comments === "string" ? body.comments.trim() : undefined;
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;
  const status = parseStatus(body.status);
  const startDate =
    typeof body.startDate === "string" ? body.startDate.trim() : undefined;
  const projectId =
    typeof body.projectId === "string"
      ? parseProjectId(body.projectId)
      : undefined;

  const data = {};

  if (typeof comments === "string") {
    data.comments = comments || null;
  }

  if (status) {
    data.status = status;
    data.completedDate = resolveCompletedDate(loaded.todo, status);
  }

  if (!isLimitedUser) {
    if (typeof description === "string") {
      data.description = description || null;
    }
    if (typeof startDate === "string") {
      const parsedDate = parseDate(startDate);
      if (!parsedDate) {
        return NextResponse.json(
          { error: "Invalid start date." },
          { status: 400 },
        );
      }
      data.startDate = parsedDate;
    }
    if (typeof projectId === "string") {
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
      data.projectId = projectId || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No updates provided." },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.update({
    where: { id: loaded.todo.id },
    data,
    include: buildTodoInclude,
  });

  return NextResponse.json(serializeTodo(todo, loaded.userId));
}

export async function DELETE(req, { params }) {
  const loaded = await loadAllowedTodo(req, params);
  if (!loaded.ok) return loaded.res;

  if (!loaded.isAdmin && !loaded.canManage) {
    return NextResponse.json(
      { error: "You can only delete todos created by you." },
      { status: 403 },
    );
  }

  await prisma.todo.delete({ where: { id: loaded.todo.id } });
  return NextResponse.json({ ok: true });
}
