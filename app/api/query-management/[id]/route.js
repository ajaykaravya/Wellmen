import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parseCategory = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "REMARKS") return "REMARKS";
  if (normalized === "URGENCY") return "URGENCY";
  if (normalized === "DECISION_PENDING") return "DECISION_PENDING";
  return null;
};

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "COMPLETED") return "COMPLETED";
  return null;
};

const parsePriority = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "LOW") return "LOW";
  if (normalized === "MEDIUM") return "MEDIUM";
  if (normalized === "HIGH") return "HIGH";
  return null;
};

const parsePayload = (body) => {
  const projectId = String(body.projectId || "").trim();
  const category = parseCategory(body.category);
  const description = String(body.description || "").trim();
  const status = parseStatus(body.status);
  const priority = parsePriority(body.priority);

  return { projectId, category, description, status, priority };
};

const serializeQuery = (query) => ({
  id: query.id,
  projectId: query.projectId,
  projectName: query.project?.name || "",
  category: query.category,
  description: query.description,
  status: query.status,
  priority: query.priority,
  createdById: query.createdById,
  createdByName:
    query.createdBy?.firstName || query.createdBy?.lastName
      ? `${query.createdBy.firstName || ""} ${query.createdBy.lastName || ""}`.trim()
      : "",
  createdAt: query.createdAt,
  updatedAt: query.updatedAt,
});

export async function GET(req, { params }) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Query id is required." }, { status: 400 });
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

  return NextResponse.json(serializeQuery(query));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Query id is required." }, { status: 400 });
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
      { error: "Project, category, description, status and priority are required." },
      { status: 400 },
    );
  }

  const existing = await prisma.queryManagement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Query not found." }, { status: 404 });
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

    return NextResponse.json(serializeQuery(query));
  } catch (error) {
    console.error("Failed to update query", error);
    return NextResponse.json(
      { error: "Failed to update query." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json({ error: "Query id is required." }, { status: 400 });
  }

  const existing = await prisma.queryManagement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Query not found." }, { status: 404 });
  }

  await prisma.queryManagement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
