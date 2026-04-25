import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { getAuthContext } from "@/lib/auth";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const category = String(body.category || "").trim();
  const name = String(body.name || "").trim();
  return { category, name };
};

export async function GET(req, { params }) {
  const auth = await getAuthContext(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Category id is required." },
      { status: 400 },
    );
  }

  const category = await prisma.categories.findUnique({ where: { id } });
  if (!category || category.category !== "PROJECT_WORK") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: category.id,
    category: category.category,
    name: category.name,
    createdAt: category.createdAt,
  });
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Category id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const payload = parsePayload(body);

  if (!payload.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (payload.category && payload.category !== "PROJECT_WORK") {
    return NextResponse.json(
      {
        error:
          "Project work categories must be updated from the Project work Categories module.",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category !== "PROJECT_WORK") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  try {
    const category = await prisma.categories.update({
      where: { id },
      data: {
        name: payload.name,
      },
    });

    return NextResponse.json({
      id: category.id,
      category: category.category,
      name: category.name,
      createdAt: category.createdAt,
    });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Category id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category !== "PROJECT_WORK") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  await prisma.categories.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
