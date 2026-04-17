import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { saveReportImages, saveReportVideo } from "../_utils/upload";

export const runtime = "nodejs";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TODO") return "TODO";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && item.trim())
      : [];
  } catch {
    return [];
  }
};

const serializeReport = (report, userId, isAdmin) => ({
  id: report.id,
  reportDate: report.reportDate,
  projectId: report.projectId,
  projectName: report.project?.name || "-",
  title: report.title,
  description: report.description,
  status: report.status,
  imageUrls: Array.isArray(report.imageUrls) ? report.imageUrls : [],
  videoUrl: report.videoUrl || null,
  createdById: report.createdById,
  createdByName: report.createdBy
    ? `${report.createdBy.firstName} ${report.createdBy.lastName}`.trim()
    : "-",
  canManage: isAdmin || report.createdById === userId,
  createdAt: report.createdAt,
});

async function loadAllowedReport(req, params) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate;

  const id = await resolveId(params);
  if (!id) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Report id is required." },
        { status: 400 },
      ),
    };
  }

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!report) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Report not found." }, { status: 404 }),
    };
  }

  const isAdmin = gate.auth?.role === "Admin";
  const userId = gate.auth?.user?.id || "";
  const canManage = report.createdById === userId;

  if (!isAdmin && !canManage) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true, report, userId, isAdmin };
}

export async function GET(req, { params }) {
  const loaded = await loadAllowedReport(req, params);
  if (!loaded.ok) return loaded.res;

  return NextResponse.json(
    serializeReport(loaded.report, loaded.userId, loaded.isAdmin),
  );
}

export async function PUT(req, { params }) {
  const loaded = await loadAllowedReport(req, params);
  if (!loaded.ok) return loaded.res;

  try {
    const form = await req.formData();

    const reportDate = String(form.get("reportDate") || "").trim();
    const projectId = String(form.get("projectId") || "").trim();
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const status = parseStatus(form.get("status")) || "TODO";
    const parsedDate = parseDate(reportDate);

    if (!reportDate || !projectId || !title || !description) {
      return NextResponse.json(
        { error: "Report date, project, title and description are required." },
        { status: 400 },
      );
    }

    if (!parsedDate) {
      return NextResponse.json(
        { error: "Invalid report date." },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    }

    const existingImages = parseJsonArray(form.get("existingImages"));
    const existingVideoUrl = String(form.get("existingVideoUrl") || "").trim();
    const removeVideo = String(form.get("removeVideo") || "").trim() === "true";

    const imageFiles = form
      .getAll("images")
      .filter((value) => value instanceof File && value.size > 0);
    const newImages = await saveReportImages(imageFiles);
    const imageUrls = [...existingImages, ...newImages];

    const videoInput = form.get("video");
    const videoFile =
      videoInput instanceof File && videoInput.size > 0 ? videoInput : null;

    let videoUrl = loaded.report.videoUrl || null;
    if (videoFile) {
      videoUrl = await saveReportVideo(videoFile);
    } else if (removeVideo) {
      videoUrl = null;
    } else if (existingVideoUrl) {
      videoUrl = existingVideoUrl;
    }

    const updated = await prisma.dailyReport.update({
      where: { id: loaded.report.id },
      data: {
        reportDate: parsedDate,
        projectId,
        title,
        description,
        status,
        imageUrls,
        videoUrl,
      },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      serializeReport(updated, loaded.userId, loaded.isAdmin),
    );
  } catch (error) {
    console.error("PUT /api/reports/[id] failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update report.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const loaded = await loadAllowedReport(req, params);
  if (!loaded.ok) return loaded.res;

  await prisma.dailyReport.delete({ where: { id: loaded.report.id } });
  return NextResponse.json({ ok: true });
}
