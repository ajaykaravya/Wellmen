import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

const parseBody = async (req) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

const normalizeToken = (value) => String(value || "").trim();
const normalizePlatform = (value) => String(value || "").trim().toLowerCase();

export async function POST(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const body = await parseBody(req);
  const token = normalizeToken(body.token);
  const platform = normalizePlatform(body.platform);
  const deviceId = normalizeToken(body.deviceId);

  if (!token) {
    return NextResponse.json(
      { error: "Push token is required." },
      { status: 400 },
    );
  }

  await prisma.deviceToken.upsert({
    where: { token },
    create: {
      token,
      platform: platform || null,
      deviceId: deviceId || null,
      user: { connect: { id: gate.auth.user.id } },
      isActive: true,
      lastSeenAt: new Date(),
    },
    update: {
      platform: platform || null,
      deviceId: deviceId || null,
      userId: gate.auth.user.id,
      isActive: true,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const body = await parseBody(req);
  const token = normalizeToken(body.token);

  if (!token) {
    return NextResponse.json(
      { error: "Push token is required." },
      { status: 400 },
    );
  }

  await prisma.deviceToken.updateMany({
    where: {
      token,
      userId: gate.auth.user.id,
    },
    data: {
      isActive: false,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
