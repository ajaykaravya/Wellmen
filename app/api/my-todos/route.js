import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

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

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id || "";
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const status = parseStatus(searchParams.get("status"));
  const date = searchParams.get("date");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const projectId = parseProjectId(searchParams.get("projectId"));
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {
    assigneeId: userId || undefined,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  const parsedFromDate = parseDate(fromDate);
  const parsedToDate = parseDate(toDate);
  if (fromDate && !parsedFromDate) {
    return NextResponse.json({ error: "Invalid fromDate." }, { status: 400 });
  }
  if (toDate && !parsedToDate) {
    return NextResponse.json({ error: "Invalid toDate." }, { status: 400 });
  }

  if (parsedFromDate || parsedToDate) {
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
        project: { select: { id: true, name: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    comments: todo.comments,
    startDate: todo.startDate,
    status: todo.status,
    projectId: todo.projectId,
    projectName: todo.project?.name || "-",
    createdById: todo.createdById,
    canManage: todo.createdById === userId,
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
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

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

  const userId = gate.auth?.user?.id || null;

  const todo = await prisma.todo.create({
    data: {
      title,
      description: description || null,
      comments: comments || null,
      startDate: parsedDate,
      status,
      projectId: projectId || null,
      assigneeId: userId,
      createdById: userId,
    },
    include: {
      assignee: { include: { role: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      comments: todo.comments,
      startDate: todo.startDate,
      status: todo.status,
      projectId: todo.projectId,
      projectName: todo.project?.name || "-",
      createdById: todo.createdById,
      canManage: true,
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
}
