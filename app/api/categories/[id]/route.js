import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const category = String(body.category || "").trim();
  const name = String(body.name || "").trim();
  return { category, name };
};

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Category id is required." }, { status: 400 });
  }

  const category = await prisma.categories.findUnique({ where: { id } });
  if (!category || category.category === "OFFICE_WORK") {
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
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Category id is required." }, { status: 400 });
  }

  const body = await req.json();
  const payload = parsePayload(body);

  if (!payload.category || !payload.name) {
    return NextResponse.json(
      { error: "Category and name are required." },
      { status: 400 },
    );
  }

  if (payload.category === "OFFICE_WORK") {
    return NextResponse.json(
      {
        error:
          "Office work categories must be updated from the Office work Categories module.",
      },
      { status: 400 },
    );
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category === "OFFICE_WORK") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  try {
    const category = await prisma.categories.update({
      where: { id },
      data: {
        category: payload.category,
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
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Category id is required." }, { status: 400 });
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category === "OFFICE_WORK") {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  await prisma.categories.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
