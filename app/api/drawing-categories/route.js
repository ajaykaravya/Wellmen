import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const categories = await prisma.drawingCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true },
  });

  return NextResponse.json(categories);
}
