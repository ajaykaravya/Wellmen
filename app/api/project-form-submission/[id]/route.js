import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);

  if (!gate.ok) return gate.res;

  try {
    const { id } = await params;

    const submission = await prisma.projectFormSubmission.findUnique({
      where: {
        id,
      },

      include: {
        // Project details are shown in the document header and PDF export, so
        // the reader can tell which hospital a printed sheet belongs to.
        project: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            contactNumber: true,
            email: true,
          },
        },

        projectForm: {
          select: {
            id: true,
            name: true,
            template: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        {
          error: "Submission not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      data: submission,
    });
  } catch (error) {
    console.error("Project form submission fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch submission",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;

  const body = await req.json();

  const submission = await prisma.projectFormSubmission.update({
    where: {
      id,
    },

    data: {
      formData: body.formData,

      status: "COMPLETED",
    },
  });

  return NextResponse.json({
    data: submission,
  });
}
