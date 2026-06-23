import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function GET(req) {
  const [needsSetupCount, auth] = await Promise.all([
    prisma.user.count(),
    getAuthContext(req),
  ]);

  const needsSetup = needsSetupCount === 0;

  if (!auth) {
    return NextResponse.json({
      authenticated: false,
      needsSetup,
    });
  }

  const { user, role } = auth;

  return NextResponse.json({
    authenticated: true,
    needsSetup,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role,
      createdAt: user.createdAt,
    },
  });
}
