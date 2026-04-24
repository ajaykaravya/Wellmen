import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { parsePayload, serializeQuery } from "@/lib/queryManagement";

const resolveId = async (params) => String((await params)?.id || "").trim();

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Query id is required." },
      { status: 400 },
    );
  }

  const query = await prisma.queryManagement.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!query) {
    return NextResponse.json({ error: "Query not found." }, { status: 404 });
  }

  return NextResponse.json(serializeQuery(query, gate.auth?.user?.id || ""));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Query id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const payload = parsePayload(body);

  if (
    !payload.projectId ||
    !payload.category ||
    !payload.description ||
    !payload.status ||
    !payload.priority
  ) {
    return NextResponse.json(
      {
        error:
          "Project, category, description, status and priority are required.",
      },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  try {
    const query = await prisma.queryManagement.update({
      where: { id },
      data: {
        projectId: payload.projectId,
        category: payload.category,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
      },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(serializeQuery(query, gate.auth?.user?.id || ""));
  } catch (error) {
    console.error("Failed to update query", error);
    return NextResponse.json(
      { error: "Failed to update query." },
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
      { error: "Query id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.queryManagement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Query not found." }, { status: 404 });
  }

  await prisma.queryManagement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
