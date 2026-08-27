import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

// The primary company is printed as a footer on exported documents, so this is
// readable by any signed-in user, not just admins.
export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const company = await prisma.company.findFirst({
    where: { isPrimary: true },
    select: {
      id: true,
      name: true,
      code: true,
      contactPerson: true,
      contactNumber: true,
      email: true,
      address: true,
      logoUrl: true,
    },
  });

  return NextResponse.json({ data: company });
}
