import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { saveMediaFile } from "@/app/api/_utils/mediaUpload";

export async function POST(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
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

  const file = form.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: "A logo file is required." }, { status: 400 });
  }

  if (!String(file.type || "").toLowerCase().startsWith("image/")) {
    return NextResponse.json(
      { error: "The logo must be an image file." },
      { status: 400 },
    );
  }

  try {
    // saveMediaFile scopes uploads by a path segment; the company id is used
    // here in place of a project id since logos are not project-specific.
    const logoUrl = await saveMediaFile(file, {
      type: "logo",
      projectId: id,
      kind: "image",
    });

    const updated = await prisma.company.update({
      where: { id },
      data: { logoUrl },
      select: { id: true, logoUrl: true },
    });

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (error) {
    console.error("POST company logo failed", error);
    return NextResponse.json(
      { error: "Failed to upload logo." },
      { status: 500 },
    );
  }
}
