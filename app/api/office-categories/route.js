import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  return { name };
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = { category: "OFFICE_WORK" };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
    ];
  }

  const [total, categories] = await Promise.all([
    prisma.categories?.count({ where }),
    prisma.categories?.findMany({
      where,
      orderBy: { createdAt: "desc" }    ,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: categories?.map((category) => ({
      id: category.id,
      category: category.category,
      name: category.name,
      createdAt: category.createdAt,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const payload = parsePayload(body);

  if (!payload.name) {
    return NextResponse.json(
      { error: "Category name is required." },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.categories.create({
      data: {
        category: "OFFICE_WORK",
        name: payload.name,
      },
    });

    return NextResponse.json(
      {
        id: category.id,
        category: category.category,
        name: category.name,
        createdAt: category.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create office category", error);
    return NextResponse.json(
      { error: "Failed to create office category." },
      { status: 500 },
    );
  }
}
