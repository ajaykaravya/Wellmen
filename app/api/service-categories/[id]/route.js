import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { getAuthContext } from "@/lib/auth";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  return { name };
};

export async function GET(req, { params }) {
  const auth = await getAuthContext(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Service category id is required." },
      { status: 400 },
    );
  }

  const category = await prisma.categories.findUnique({ where: { id } });
  if (!category || category.category !== "SERVICE_WORK") {
    return NextResponse.json(
      { error: "Service category not found." },
      { status: 404 },
    );
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
      { error: "Service category id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const payload = parsePayload(body);
  if (!payload.name) {
    return NextResponse.json(
      { error: "Category name is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category !== "SERVICE_WORK") {
    return NextResponse.json(
      { error: "Service category not found." },
      { status: 404 },
    );
  }

  try {
    const category = await prisma.categories.update({
      where: { id },
      data: { name: payload.name },
    });

    return NextResponse.json({
      id: category.id,
      category: category.category,
      name: category.name,
      createdAt: category.createdAt,
    });
  } catch (error) {
    console.error("Failed to update service category", error);
    return NextResponse.json(
      { error: "Failed to update service category." },
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
      { error: "Service category id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing || existing.category !== "SERVICE_WORK") {
    return NextResponse.json(
      { error: "Service category not found." },
      { status: 404 },
    );
  }

  await prisma.categories.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
