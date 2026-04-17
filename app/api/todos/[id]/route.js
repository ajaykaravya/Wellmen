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
    },
  });

  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    comments: todo.comments,
    startDate: todo.startDate,
    status: todo.status,
    projectId: todo.projectId,
    projectName: todo.project?.name || "-",
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
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const comments = String(body.comments || "").trim();
  const startDate = String(body.startDate || "").trim();
  const status = parseStatus(body.status);
  const assigneeId = String(body.assigneeId || "").trim();
  const projectId = parseProjectId(body.projectId);

  if (!title || !startDate) {
    return NextResponse.json(
      { error: "Task title and start date are required." },
      { status: 400 },
    );
  }

  const parsedDate = parseDate(startDate);
  if (!parsedDate) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
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
      title,
      description: description || null,
      comments: comments || null,
      startDate: parsedDate,
      status: status || "TODO",
      projectId: projectId || null,
      assigneeId: assigneeId || null,
    },
    include: {
      assignee: { include: { role: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    comments: todo.comments,
    startDate: todo.startDate,
    status: todo.status,
    projectId: todo.projectId,
    projectName: todo.project?.name || "-",
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
