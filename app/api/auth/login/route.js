import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie, verifyPassword } from "@/lib/auth";

export async function POST(req) {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const body = await req.json();
    const mobileNumber = String(body.mobileNumber || "").trim();
    const password = String(body.password || "");

    if (!mobileNumber || !password) {
      return NextResponse.json(
        { error: "Mobile number and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        mobileNumber,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "User is missing a password hash." },
        { status: 500 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const token = signAuthToken({
      sub: user.id,
      role: user.role?.name || null,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role?.name || null,
        createdAt: user.createdAt,
      },
    });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return NextResponse.json(
      {
        error: "Login failed.",
        ...(isDev ? { details: String(error?.message || error) } : {}),
      },
      { status: 500 }
    );
  }
}
