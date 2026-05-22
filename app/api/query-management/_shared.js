import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export const isAdminRole = (auth) =>
  auth?.role === "Admin" || auth?.role === "Manager";

export const buildQueryInclude = {
  project: { select: { name: true, city: true } },
  createdBy: { select: { firstName: true, lastName: true } },
};

export const loadAllowedQuery = async (req, params) => {
  const auth = await getAuthContext(req);
  if (!auth) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const id = String((await params)?.id || "").trim();
  if (!id) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Query id is required." }, { status: 400 }),
    };
  }

  const query = await prisma.queryManagement.findUnique({
    where: { id },
    include: buildQueryInclude,
  });

  if (!query) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Query not found." }, { status: 404 }),
    };
  }

  const userId = auth.user?.id || "";
  const isAdmin = isAdminRole(auth);
  const isOwner = query.createdById === userId;

  if (!isAdmin && !isOwner) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true, auth, query, userId, isAdmin, isOwner };
};
