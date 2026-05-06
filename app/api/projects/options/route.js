import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const projects = await prisma.project.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
    },
  });

  return NextResponse.json(projects);
}
