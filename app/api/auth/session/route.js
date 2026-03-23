import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

export async function GET(req) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { user, role, permissions } = auth;
  return NextResponse.json({
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
    permissions,
  });
}
