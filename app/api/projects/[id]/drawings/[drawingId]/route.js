import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { deleteMediaFile } from "@/app/api/_utils/mediaUpload";

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { id: projectId, drawingId } = await params;

  const drawing = await prisma.projectDrawing.findUnique({
    where: { id: drawingId },
  });
  if (!drawing || drawing.projectId !== projectId) {
    return NextResponse.json({ error: "Drawing not found." }, { status: 404 });
  }

  await deleteMediaFile(drawing.fileUrl);

  await prisma.projectDrawing.delete({ where: { id: drawingId } });

  return NextResponse.json({ success: true });
}
