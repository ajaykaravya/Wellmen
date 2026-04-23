import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureDefaults } from "@/lib/seed";

const JWT_COOKIE = "auth_token";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAuthToken(payload, options = {}) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: "7d", ...options });
}

export function verifyAuthToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.get(JWT_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const [type, token] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function getAuthContext(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const userId = payload?.sub;
    if (!userId) return null;

    await ensureDefaults();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) return null;

    const permissions =
      user.role?.rolePermissions?.map((rp) => rp.permission.name) || [];

    return {
      user,
      role: user.role?.name || null,
      permissions,
      token,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  res.cookies.set(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.cookies.delete(JWT_COOKIE);
}
