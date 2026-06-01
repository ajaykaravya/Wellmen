import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const STATUSES = ["ACTIVE", "INACTIVE"];

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  const status = String(body.status || "").trim().toUpperCase();
  return { name, status };
};

const isValidStatus = (status) => STATUSES.includes(status);

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
    where.name = { contains: query, mode: "insensitive" };
  }

  if (status) {
    if (!isValidStatus(status)) {
      return NextResponse.json(
        { error: "Invalid income type status filter." },
        { status: 400 },
      );
    }
    where.status = status;
  }

  const [total, incomeTypes] = await Promise.all([
    prisma.incomeType.count({ where }),
    prisma.incomeType.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: incomeTypes.map((incomeType) => ({
      id: incomeType.id,
      name: incomeType.name,
      status: incomeType.status,
      createdAt: incomeType.createdAt,
    })),
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

  try {
    const incomeType = await prisma.incomeType.create({
      data: {
        name: payload.name,
        status: payload.status,
      },
    });

    return NextResponse.json(
      {
        id: incomeType.id,
        name: incomeType.name,
        status: incomeType.status,
        createdAt: incomeType.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An income type with this name already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to create income type", error);
    return NextResponse.json(
      { error: "Failed to create income type." },
      { status: 500 },
    );
  }
}
