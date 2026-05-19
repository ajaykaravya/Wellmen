import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { buildTransportRecord, serializeTransportLog } from "../_utils";

const resolveId = async (params) => String((await params)?.id || "").trim();

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Transport log id is required." },
      { status: 400 },
    );
  }

  const row = await prisma.transportLog.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!row) {
    return NextResponse.json(
      { error: "Transport log not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(serializeTransportLog(row));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Transport log id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.transportLog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Transport log not found." },
      { status: 404 },
    );
  }

  try {
    const body = await req.json();
    const record = buildTransportRecord(body);

    const updated = await prisma.transportLog.update({
      where: { id },
      data: {
        ...record,
        serialNo: existing.serialNo,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(serializeTransportLog(updated));
  } catch (error) {
    console.error("Failed to update transport log", error);
    return NextResponse.json(
      { error: error.message || "Failed to update transport log." },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Transport log id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.transportLog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Transport log not found." },
      { status: 404 },
    );
  }

  await prisma.transportLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
