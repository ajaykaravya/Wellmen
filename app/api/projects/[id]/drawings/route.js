import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/rbac";
import { saveMediaFile, getDrawingFileType } from "@/app/api/_utils/mediaUpload";

const serialize = (row) => ({
  id: row.id,
  projectId: row.projectId,
  drawingCategoryId: row.drawingCategoryId,
  categoryName: row.drawingCategory?.name || null,
  fileType: row.fileType,
  fileUrl: row.fileUrl,
  fileName: row.fileName,
  fileSize: row.fileSize,
  uploadedById: row.uploadedById,
  uploadedByName: row.uploadedBy?.fullName || null,
  createdAt: row.createdAt,
});

export async function GET(req, { params }) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const { id: projectId } = await params;

  const drawings = await prisma.projectDrawing.findMany({
    where: { projectId },
    include: { drawingCategory: true, uploadedBy: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ data: drawings.map(serialize) });
}

export async function POST(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const drawingCategoryId = String(form.get("drawingCategoryId") || "").trim();
  if (!drawingCategoryId) {
    return NextResponse.json(
      { error: "Drawing category is required." },
      { status: 400 },
    );
  }

  const category = await prisma.drawingCategory.findUnique({
    where: { id: drawingCategoryId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Drawing category not found." },
      { status: 404 },
    );
  }

  const files = form.getAll("files").filter((item) => item instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required." },
      { status: 400 },
    );
  }

  // Validate every file before writing any, so a rejected file cannot leave a
  // partially uploaded set behind.
  for (const file of files) {
    if (!getDrawingFileType(file.name)) {
      return NextResponse.json(
        {
          error: `Unsupported file "${file.name}". Allowed: PDF, PPT/PPTX, JPG/JPEG/PNG, DWG/DXF.`,
        },
        { status: 400 },
      );
    }
  }

  try {
    const created = [];
    for (const file of files) {
      const fileUrl = await saveMediaFile(file, {
        type: "drawings",
        projectId,
        kind: "drawing",
      });
      if (!fileUrl) continue;

      const row = await prisma.projectDrawing.create({
        data: {
          projectId,
          drawingCategoryId,
          fileType: getDrawingFileType(file.name),
          fileUrl,
          fileName: file.name,
          fileSize: Number.isFinite(file.size) ? file.size : null,
          uploadedById: gate.auth?.user?.id || null,
        },
        include: { drawingCategory: true, uploadedBy: true },
      });
      created.push(serialize(row));
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("POST project drawings failed", error);
    return NextResponse.json(
      { error: "Failed to upload drawing." },
      { status: 500 },
    );
  }
}
