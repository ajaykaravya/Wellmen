import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  try {
    const projectForms = await prisma.projectForm.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const data = projectForms.map((projectForm) => ({
      id: projectForm.id,
      name: projectForm.name,
      status: projectForm.status,
    }));

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error("Project form fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch project forms",
      },
      {
        status: 500,
      },
    );
  }
}
