import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  try {
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          error: "projectId is required",
        },
        {
          status: 400,
        },
      );
    }

    const projectForms = await prisma.projectFormSubmission.findMany({
      where: {
        projectId,
      },

      include: {
        projectForm: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    const data = projectForms.map((submission) => ({
      id: submission.id,

      formId: submission.projectForm.id,

      name: submission.projectForm.name,

      status: submission.status,

      formData: submission.formData,
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
