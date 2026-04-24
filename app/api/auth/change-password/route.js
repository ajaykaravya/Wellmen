import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const authGate = await requireAuth(req);
    if (!authGate.ok) return authGate.res;

    const { auth } = authGate;
    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Current password, new password, and confirm password are required." },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must be exactly 4 digits." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirm password do not match." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "User is missing a password hash." },
        { status: 500 },
      );
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 },
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/change-password failed", error);
    return NextResponse.json(
      {
        error: "Failed to change password.",
        ...(isDev ? { details: String(error?.message || error) } : {}),
      },
      { status: 500 },
    );
  }
}
