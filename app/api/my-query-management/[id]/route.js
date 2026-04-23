import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { parsePayload, serializeQuery } from "@/lib/queryManagement";

const resolveId = async (params) => String((await params)?.id || "").trim();

async function loadAllowedQuery(req, params) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const id = await resolveId(params);
  if (!id) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Query id is required." }, { status: 400 }),
    };
  }

  const query = await prisma.queryManagement.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!query) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Query not found." }, { status: 404 }),
    };
  }

  const userId = auth.user?.id || "";
  const isAdmin = auth.role === "Admin";
  const isOwner = query.createdById === userId;

  if (!isAdmin && !isOwner) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true, auth, query, userId, isAdmin, isOwner };
}

export async function GET(req, { params }) {
  const loaded = await loadAllowedQuery(req, params);
  if (!loaded.ok) return loaded.res;
  return NextResponse.json(serializeQuery(loaded.query, loaded.userId));
}

export async function PUT(req, { params }) {
  const loaded = await loadAllowedQuery(req, params);
  if (!loaded.ok) return loaded.res;

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
      where: { id: loaded.query.id },
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

    return NextResponse.json(serializeQuery(query, loaded.userId));
  } catch (error) {
    console.error("Failed to update query", error);
    return NextResponse.json(
      { error: "Failed to update query." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const loaded = await loadAllowedQuery(req, params);
  if (!loaded.ok) return loaded.res;

  await prisma.queryManagement.delete({ where: { id: loaded.query.id } });
  return NextResponse.json({ ok: true });
}
