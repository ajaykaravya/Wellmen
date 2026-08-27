import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const serializeCompany = (company) => ({
  id: company.id,
  name: company.name,
  code: company.code,
  contactPerson: company.contactPerson,
  contactNumber: company.contactNumber,
  email: company.email,
  address: company.address,
  logoUrl: company.logoUrl,
  isPrimary: company.isPrimary,
  updatedAt: company.updatedAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: companies.map(serializeCompany) });
}
