import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePayload,
  parseMultipartPayload,
  parseJsonArray,
  getUploadedFiles,
  serializeQuery,
} from "@/lib/queryManagement";
import {
  buildQueryInclude,
  loadAllowedQuery,
} from "../_shared";
import { saveQueryImages, saveQueryVideos } from "../_utils/upload";

export async function GET(req, { params }) {
  const loaded = await loadAllowedQuery(req, params);
  if (!loaded.ok) return loaded.res;

  return NextResponse.json(serializeQuery(loaded.query, loaded.userId));
}

export async function PUT(req, { params }) {
  const loaded = await loadAllowedQuery(req, params);
  if (!loaded.ok) return loaded.res;

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");
  const body = isMultipart ? await req.formData() : await req.json();
  const payload = isMultipart
    ? parseMultipartPayload(body)
    : parsePayload(body);
  const existingImages = isMultipart
    ? parseJsonArray(body.get("existingImages"))
    : [];
  const existingVideoUrls = isMultipart
    ? parseJsonArray(body.get("existingVideoUrls"))
    : [];
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
    const [newImages, newVideoUrls] = await Promise.all([
      saveQueryImages(imageFiles, payload.projectId),
      saveQueryVideos(videoFiles, payload.projectId),
    ]);

    const imageUrls = [...existingImages, ...newImages];
    const videoUrls = [...existingVideoUrls, ...newVideoUrls];

    const query = await prisma.queryManagement.update({
      where: { id: loaded.query.id },
      data: {
        project: { connect: { id: payload.projectId } },
        category: payload.category,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        imageUrls,
        videoUrls,
      },
      include: {
        ...buildQueryInclude,
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
