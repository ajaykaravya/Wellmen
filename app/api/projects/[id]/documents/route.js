import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { saveMediaFile, getDocumentFileType } from "@/app/api/_utils/mediaUpload";

// Uploads files for a project form's fileUpload section and returns their
// metadata. The URLs are stored by the form itself inside its formData JSON,
// so nothing is persisted here beyond the files.
export async function POST(req, { params }) {
  const gate = await requireAuth(req);
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

  const files = form.getAll("files").filter((item) => item instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required." },
      { status: 400 },
    );
  }

  // Validate everything before writing any file, so a rejected file cannot
  // leave a partially uploaded set behind.
  for (const file of files) {
    if (!getDocumentFileType(file.name)) {
      return NextResponse.json(
        { error: `Unsupported file "${file.name}". Allowed: PDF, DOC, DOCX.` },
        { status: 400 },
      );
    }
  }

  try {
    const uploaded = [];
    for (const file of files) {
      const url = await saveMediaFile(file, {
        type: "documents",
        projectId,
        kind: "document",
      });
      if (!url) continue;
      uploaded.push({
        url,
        name: file.name,
        size: Number.isFinite(file.size) ? file.size : null,
        fileType: getDocumentFileType(file.name),
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ data: uploaded }, { status: 201 });
  } catch (error) {
    console.error("POST project documents failed", error);
    return NextResponse.json(
      { error: "Failed to upload document." },
      { status: 500 },
    );
  }
}
