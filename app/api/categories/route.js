import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { getAuthContext } from "@/lib/auth";

const parsePayload = (body) => {
  const category = String(body.category || "").trim();
  const name = String(body.name || "").trim();
  return { category, name };
};

export async function GET(req) {
  const auth = await getAuthContext(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  let where = { category: "PROJECT_WORK" };
  if (query) {
    where = {
      AND: [
        { category: "PROJECT_WORK" },
        {
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        },
      ],
    };
  }

  const [total, categories] = await Promise.all([
    prisma.categories?.count({ where }),
    prisma.categories?.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (payload.category && payload.category !== "PROJECT_WORK") {
    return NextResponse.json(
      {
        error:
          "Project work categories must be created from the Project work Categories module.",
      },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.categories.create({
      data: {
        category: "PROJECT_WORK",
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
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to create category", error);
    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 },
    );
  }
}
