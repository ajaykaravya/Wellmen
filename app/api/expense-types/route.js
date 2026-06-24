import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const STATUSES = ["ACTIVE", "INACTIVE"];

const normalizeUserIds = (value) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
};

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  const status = String(body.status || "").trim().toUpperCase();
  const userIds = normalizeUserIds(body.userIds ?? body.userId);
  return { name, status, userIds };
};

const isValidStatus = (status) => STATUSES.includes(status);

const serializeExpenseType = (expenseType) => ({
  id: expenseType.id,
  name: expenseType.name,
  status: expenseType.status,
  userIds: expenseType.expenseTypeUsers?.map((item) => item.userId) || [],
  users:
    expenseType.expenseTypeUsers?.map((item) =>
      item.user
        ? {
            id: item.user.id,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
          }
        : null,
    ).filter(Boolean) || [],
  createdAt: expenseType.createdAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const status = String(searchParams.get("status") || "").trim().toUpperCase();
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {};
  if (query) {
    where.name = { contains: query };
  }

  if (status) {
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: "Invalid expense type status filter." },
        { status: 400 },
      );
    }
    where.status = status;
  }

  const [total, expenseTypes] = await Promise.all([
    prisma.expenseType.count({ where }),
    prisma.expenseType.findMany({
      where,
      include: {
        expenseTypeUsers: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: expenseTypes.map(serializeExpenseType),
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
  const payload = parsePayload(body);

  if (!payload.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isValidStatus(payload.status)) {
    return NextResponse.json(
      { error: "Valid status is required." },
      { status: 400 },
    );
  }
  if (payload.userIds.length === 0) {
    return NextResponse.json(
      { error: "At least one user is required." },
      { status: 400 },
    );
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: payload.userIds },
    },
    select: { id: true },
  });
  if (users.length !== payload.userIds.length) {
    return NextResponse.json({ error: "User not found." }, { status: 400 });
  }

  try {
    const expenseType = await prisma.expenseType.create({
      data: {
        name: payload.name,
        status: payload.status,
        expenseTypeUsers: {
          create: payload.userIds.map((userId) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
      include: {
        expenseTypeUsers: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(serializeExpenseType(expenseType), { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An expense type with this name already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to create expense type", error);
    return NextResponse.json(
      { error: "Failed to create expense type." },
      { status: 500 },
    );
  }
}
