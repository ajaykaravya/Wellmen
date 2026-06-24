import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const expenseTypes = await prisma.expenseType.findMany({
    include: {
      expenseTypeUsers: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json(
    expenseTypes.map((expenseType) => ({
      id: expenseType.id,
      name: expenseType.name,
      status: expenseType.status,
      users:
        expenseType.expenseTypeUsers
          ?.map((item) =>
            item.user
              ? {
                  id: item.user.id,
                  firstName: item.user.firstName,
                  lastName: item.user.lastName,
                }
              : null,
          )
          .filter(Boolean) || [],
    })),
  );
}
