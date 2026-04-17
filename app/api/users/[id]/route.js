import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAnyPermission, requireAuth } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

export async function GET(req, { params }) {
  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "User id is required." },
      { status: 400 },
    );
  }

  const authGate = await requireAuth(req);
  if (!authGate.ok) return authGate.res;

  const { auth } = authGate;
  const canViewAll = auth.permissions.includes("view_users");
  if (!canViewAll && auth.user.id !== id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role?.name || null,
    createdAt: user.createdAt,
  });
}

export async function PUT(req, { params }) {
  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "User id is required." },
      { status: 400 },
    );
  }

  const authGate = await requireAuth(req);
  if (!authGate.ok) return authGate.res;

  const { auth } = authGate;
  const canEditAll =
    auth.permissions.includes("edit_user") ||
    auth.permissions.includes("manage_employees");
  const canUpdateSelf = auth.permissions.includes("update_profile");
  const isSelf = auth.user.id === id;
  if (!canEditAll && (!isSelf || !canUpdateSelf)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json();
  const isDev = process.env.NODE_ENV !== "production";

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const mobileNumber = String(body.mobileNumber || "").trim();
  const password = String(body.password || "");
  const roleId = String(body.roleId || "").trim();
  const roleName = String(body.roleName || "").trim();

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (existing.role?.name === "Admin" && auth.user.id !== id && !canEditAll) {
      return NextResponse.json(
        { error: "Admin accounts can only be updated in My Profile." },
        { status: 403 },
      );
    }

    const data = {};
    const resolvedFirstName = firstName || existing.firstName;
    const resolvedLastName = lastName || existing.lastName;
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (firstName || lastName) {
      data.fullName = `${resolvedFirstName} ${resolvedLastName}`.trim();
    }
    if (body.email !== undefined) data.email = email || null;
    if (mobileNumber) data.mobileNumber = mobileNumber;
    if (password) {
      // Validate password format: exactly 4 digits
      if (!/^\d{4}$/.test(password)) {
        return NextResponse.json(
          { error: "Password must be exactly 4 digits." },
          { status: 400 },
        );
      }
      data.passwordHash = await hashPassword(password);
    }

    if (roleId || roleName) {
      if (!auth.permissions.includes("assign_roles")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const role = await prisma.role.findFirst({
        where: roleId ? { id: roleId } : { name: roleName },
      });
      if (!role) {
        return NextResponse.json({ error: "Role not found." }, { status: 400 });
      }
      data.roleId = role.id;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role?.name || null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("PUT /api/users/[id] failed", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email or mobile number already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: "Failed to update user.",
        ...(isDev ? { details: String(error?.message || error) } : {}),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "User id is required." },
      { status: 400 },
    );
  }

  const gate = await requireAnyPermission(req, [
    "delete_user",
    "manage_employees",
  ]);
  if (!gate.ok) return gate.res;

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (existing.role?.name === "Admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted." },
      { status: 403 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
