import { NextResponse } from "next/server";
import { getAuthContext, getAuthorizationContext } from "@/lib/auth";

export async function requireAuth(req) {
  const auth = await getAuthContext(req);
  if (!auth) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  return { ok: true, auth };
}

export async function requirePermission(req, permission) {
  const auth = await getAuthorizationContext(req);
  if (!auth) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (!auth.permissions.includes(permission)) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { ok: true, auth };
}

export async function requireAnyPermission(req, permissions) {
  const auth = await getAuthorizationContext(req);
  if (!auth) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  const hasAny = permissions.some((perm) => auth.permissions.includes(perm));
  if (!hasAny) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { ok: true, auth };
}

export async function requireRole(req, roles) {
  const base = await requireAuth(req);
  if (!base.ok) return base;

  const { auth } = base;
  if (!roles.includes(auth.role)) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { ok: true, auth };
}
