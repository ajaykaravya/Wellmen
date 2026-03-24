import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TODO") return "TODO";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "DONE") return "DONE";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parseProjectId = (value) => String(value || "").trim();

const serializeTodo = (todo, userId) => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  comments: todo.comments,
  startDate: todo.startDate,
  status: todo.status,
  assigneeId: todo.assigneeId,
  projectId: todo.projectId,
  projectName: todo.project?.name || "-",
  createdById: todo.createdById,
  canManage: todo.createdById === userId,
  createdAt: todo.createdAt,
});

async function loadAllowedTodo(req, params) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate;

  const id = await resolveId(params);
  if (!id) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Todo id is required." }, { status: 400 }),
    };
  }

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!todo) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Todo not found." }, { status: 404 }),
    };
  }

  const isAdmin = gate.auth?.role === "Admin";
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
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const status = parseStatus(body.status) || "TODO";
  const projectId = parseProjectId(body.projectId);
  const parsedDate = parseDate(startDate);

  if (!title || !startDate) {
    return NextResponse.json(
      { error: "Task title and start date are required." },
      { status: 400 },
    );
  }

  if (!parsedDate) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }

  if (projectId) {
    const exists = await prisma.project.findUnique({ where: { id: projectId } });
    if (!exists) {
      return NextResponse.json({ error: "Project not found." }, { status: 400 });
    }
  }

  const todo = await prisma.todo.update({
    where: { id: loaded.todo.id },
    data: {
      title,
      description: description || null,
      comments: comments || null,
      startDate: parsedDate,
      status,
      projectId: projectId || null,
    },
    include: { project: { select: { id: true, name: true } } },
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
      typeof body.title === "string" ||
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
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const status = parseStatus(body.status);
  const startDate =
    typeof body.startDate === "string" ? body.startDate.trim() : undefined;
  const projectId =
    typeof body.projectId === "string" ? parseProjectId(body.projectId) : undefined;

  const data = {};

  if (typeof comments === "string") {
    data.comments = comments || null;
  }

  if (status) {
    data.status = status;
  }

  if (!isLimitedUser) {
    if (typeof description === "string") {
      data.description = description || null;
    }
    if (typeof title === "string") {
      if (!title) {
        return NextResponse.json(
          { error: "Task title cannot be empty." },
          { status: 400 },
        );
      }
      data.title = title;
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
        const exists = await prisma.project.findUnique({ where: { id: projectId } });
        if (!exists) {
          return NextResponse.json({ error: "Project not found." }, { status: 400 });
        }
      }
      data.projectId = projectId || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  const todo = await prisma.todo.update({
    where: { id: loaded.todo.id },
    data,
    include: { project: { select: { id: true, name: true } } },
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
