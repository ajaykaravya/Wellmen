import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

export async function POST(req, { params }) {
  const gate = await requirePermission(req, "assign_roles");
  if (!gate.ok) return gate.res;

  const roleId = String(params?.id || "").trim();
  if (!roleId) {
    return NextResponse.json({ error: "Role id is required." }, { status: 400 });
  }

  const body = await req.json();
  const permissionIds = Array.isArray(body.permissionIds)
    ? body.permissionIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!permissionIds.length) {
    return NextResponse.json(
      { error: "permissionIds is required." },
      { status: 400 }
    );
  }

  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true });
}
