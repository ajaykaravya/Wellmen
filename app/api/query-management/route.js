import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import {
  parsePayload,
  parseCategory,
  parseStatus,
  parsePriority,
  parseMultipartPayload,
  getUploadedFiles,
  serializeQuery,
} from "@/lib/queryManagement";
import { buildQueryInclude, isAdminRole } from "./_shared";
import { saveQueryImages, saveQueryVideos } from "./_utils/upload";

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id || "";
  const isAdmin = isAdminRole(gate.auth);
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const category = parseCategory(searchParams.get("category"));
  const status = parseStatus(searchParams.get("status"));
  const priority = parsePriority(searchParams.get("priority"));
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  const page =
    pageParam && Number.isFinite(Number(pageParam)) ? Number(pageParam) : null;

  const pageSize =
    pageSizeParam && Number.isFinite(Number(pageSizeParam))
      ? Math.min(Number(pageSizeParam), 100)
      : null;

  const where = isAdmin ? {} : { createdById: userId };
  if (q) {
    where.OR = [
      { description: { contains: q } },
      { project: { name: { contains: q } } },
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
      include: buildQueryInclude,
      ...(page && pageSize
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    }),
  ]);

  return NextResponse.json({
    data: queries.map((query) => serializeQuery(query, userId)),
    page,
    pageSize,
    total,
    totalPages: page && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  });
}

export async function POST(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const body = isMultipart ? await req.formData() : await req.json();
  const payload = isMultipart
    ? parseMultipartPayload(body)
    : parsePayload(body);
  const imageFiles = isMultipart ? getUploadedFiles(body, "images") : [];
  const videoFiles = isMultipart ? getUploadedFiles(body, "videos") : [];

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
    const [imageUrls, videoUrls] = await Promise.all([
      saveQueryImages(imageFiles, payload.projectId),
      saveQueryVideos(videoFiles, payload.projectId),
    ]);

    const userId = gate.auth?.user?.id;
    const query = await prisma.queryManagement.create({
      data: {
        project: { connect: { id: payload.projectId } },
        category: payload.category,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        imageUrls,
        videoUrls,
        ...(userId && { createdBy: { connect: { id: userId } } }),
      },
      include: {
        project: { select: { name: true, city: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(serializeQuery(query, userId || ""), {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create query", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create query.",
      },
      { status: 500 },
    );
  }
}
