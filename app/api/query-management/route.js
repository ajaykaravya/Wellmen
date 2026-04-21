import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

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

export async function GET(req) {
  const auth = await getAuthContext(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const category = parseCategory(searchParams.get("category"));
  const status = parseStatus(searchParams.get("status"));
  const priority = parsePriority(searchParams.get("priority"));
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {};

  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { project: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (category) where.category = category;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [total, queries] = await Promise.all([
    prisma.queryManagement.count({ where }),
    prisma.queryManagement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: queries.map(serializeQuery),
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

  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  try {
    const query = await prisma.queryManagement.create({
      data: {
        projectId: payload.projectId,
        category: payload.category,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        createdById: gate.auth?.user?.id || null,
      },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(serializeQuery(query), { status: 201 });
  } catch (error) {
    console.error("Failed to create query", error);
    return NextResponse.json(
      { error: "Failed to create query." },
      { status: 500 },
    );
  }
}
