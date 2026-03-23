import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requirePermission(req, "manage_roles");
  if (!gate.ok) return gate.res;

  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    roles.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.rolePermissions.map((rp) => rp.permission.name),
    }))
  );
}

export async function POST(req) {
  const gate = await requirePermission(req, "manage_roles");
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Role name is required." }, { status: 400 });
  }

  try {
    const role = await prisma.role.create({ data: { name } });
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Role already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
  }
}
