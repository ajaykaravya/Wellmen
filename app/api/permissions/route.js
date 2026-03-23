import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requirePermission(req, "manage_permissions");
  if (!gate.ok) return gate.res;

  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(permissions);
}

export async function POST(req) {
  const gate = await requirePermission(req, "manage_permissions");
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Permission name is required." },
      { status: 400 }
    );
  }

  try {
    const permission = await prisma.permission.create({ data: { name } });
    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Permission already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create permission." }, { status: 500 });
  }
}
