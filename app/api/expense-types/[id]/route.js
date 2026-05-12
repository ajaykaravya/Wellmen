import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const STATUSES = ["ACTIVE", "INACTIVE"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  const status = String(body.status || "").trim().toUpperCase();
  return { name, status };
};

const isValidStatus = (status) => STATUSES.includes(status);

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Expense type id is required." },
      { status: 400 },
    );
  }

  const expenseType = await prisma.expenseType.findUnique({ where: { id } });
  if (!expenseType) {
    return NextResponse.json({ error: "Expense type not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: expenseType.id,
    name: expenseType.name,
    status: expenseType.status,
    createdAt: expenseType.createdAt,
  });
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Expense type id is required." },
      { status: 400 },
    );
  }

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

  const existing = await prisma.expenseType.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense type not found." }, { status: 404 });
  }

  try {
    const expenseType = await prisma.expenseType.update({
      where: { id },
      data: {
        name: payload.name,
        status: payload.status,
      },
    });

    return NextResponse.json({
      id: expenseType.id,
      name: expenseType.name,
      status: expenseType.status,
      createdAt: expenseType.createdAt,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An expense type with this name already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to update expense type", error);
    return NextResponse.json(
      { error: "Failed to update expense type." },
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
      { error: "Expense type id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.expenseType.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Expense type not found." }, { status: 404 });
  }

  await prisma.expenseType.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
