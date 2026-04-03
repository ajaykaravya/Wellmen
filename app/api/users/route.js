import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireAnyPermission, requireRole } from "@/lib/rbac";
import { ensureDefaults } from "@/lib/seed";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {
    // Include all users, including admins
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { role: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role?.name || null,
    createdAt: user.createdAt,
  }));

  return NextResponse.json({
    data,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const body = await req.json();
  const isDev = process.env.NODE_ENV !== "production";

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(body.email || "").trim().toLowerCase();
  const mobileNumber = String(body.mobileNumber || "").trim();
  const password = String(body.password || "");
  const roleId = String(body.roleId || "").trim();
  const roleName = String(body.roleName || "").trim();

  if (!firstName || !lastName || !email || !mobileNumber || !password) {
    return NextResponse.json(
      { error: "firstName, lastName, email, mobileNumber, and password are required." },
      { status: 400 }
    );
  }

  const userCount = await prisma.user.count();
  const isBootstrap = userCount === 0;
  if (isBootstrap) {
    await ensureDefaults();
  } else {
    const gate = await requireRole(req, ["Admin"]);
    if (!gate.ok) return gate.res;
  }

  try {
    const fallbackRoleName = isBootstrap ? "Admin" : "Employee";
    const role =
      roleId || roleName
        ? await prisma.role.findFirst({
            where: roleId ? { id: roleId } : { name: roleName },
          })
        : await prisma.role.findFirst({ where: { name: fallbackRoleName } });

    if (!role) {
      return NextResponse.json({ error: "Role not found." }, { status: 400 });
    }

    // if (pin && role.name !== "Employee") {
    //   return NextResponse.json(
    //     { error: "PIN login is allowed for Employee role only." },
    //     { status: 400 }
    //   );
    // }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        fullName,
        email,
        mobileNumber,
        passwordHash,
        roleId: role.id,
      },
      include: { role: true },
    });

    return NextResponse.json(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role?.name || null,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/users failed", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email or mobile number already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to create user.",
        ...(isDev ? { details: String(error?.message || error) } : {}),
      },
      { status: 500 }
    );
  }
}
