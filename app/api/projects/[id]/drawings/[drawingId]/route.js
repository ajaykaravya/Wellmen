import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { supabase } from "@/lib/supabase";

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

  // Remove the stored file on a best-effort basis - a missing or unreachable
  // file must not block removing the record.
  try {
    if (drawing.fileUrl.startsWith("/uploads/")) {
      await unlink(
        path.join(process.cwd(), "public", drawing.fileUrl.replace(/^\//, "")),
      );
    } else if (supabase) {
      const marker = "/storage/v1/object/public/wellmen/";
      const index = drawing.fileUrl.indexOf(marker);
      if (index !== -1) {
        await supabase.storage
          .from("wellmen")
          .remove([drawing.fileUrl.slice(index + marker.length)]);
      }
    }
  } catch (error) {
    console.warn("Failed to remove drawing file, deleting record anyway", error);
  }

  await prisma.projectDrawing.delete({ where: { id: drawingId } });

  return NextResponse.json({ success: true });
}
