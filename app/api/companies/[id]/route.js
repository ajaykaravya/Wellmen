import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { serializeCompany } from "../route";

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  return NextResponse.json({ data: serializeCompany(company) });
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const { id } = await params;
  const body = await req.json();

  const name = String(body.name || "").trim();
  const code = String(body.code || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 },
    );
  }
  if (!code) {
    return NextResponse.json(
      { error: "Company code is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const blankToNull = (value) => {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  const makePrimary = body.isPrimary === true;

  try {
    const company = await prisma.$transaction(async (tx) => {
      // Exactly one company can be primary, so clear the flag elsewhere first.
      if (makePrimary) {
        await tx.company.updateMany({
          where: { id: { not: id }, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.company.update({
      where: { id },
      data: {
        name,
        code,
        contactPerson: blankToNull(body.contactPerson),
        contactNumber: blankToNull(body.contactNumber),
        email: blankToNull(body.email),
        address: blankToNull(body.address),
        // Only replace the logo when a new URL is supplied, so saving the form
        // without re-uploading keeps the existing one.
        ...(body.logoUrl === undefined
          ? {}
          : { logoUrl: blankToNull(body.logoUrl) }),
        ...(body.isPrimary === undefined ? {} : { isPrimary: makePrimary }),
      },
      });
    });

    return NextResponse.json({ data: serializeCompany(company) });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Another company already uses that name or code." },
        { status: 409 },
      );
    }
    console.error("PUT company failed", error);
    return NextResponse.json(
      { error: "Failed to update company." },
      { status: 500 },
    );
  }
}
