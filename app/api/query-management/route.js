import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  parsePayload,
  parseCategory,
  parseStatus,
  parsePriority,
  parseMultipartPayload,
  getUploadedFiles,
  serializeQuery,
} from "@/lib/queryManagement";
import { saveQueryImages, saveQueryVideos } from "./_utils/upload";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

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
    data: queries.map((query) =>
      serializeQuery(query, gate.auth?.user?.id || ""),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
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
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(serializeQuery(query, gate.auth?.user?.id || ""), {
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
