import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const incomeTypes = await prisma.incomeType.findMany({
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json(
    incomeTypes.map((incomeType) => ({
      id: incomeType.id,
      name: incomeType.name,
      status: incomeType.status,
    })),
  );
}
