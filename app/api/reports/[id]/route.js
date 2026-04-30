import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { saveReportImages, saveReportVideos } from "../_utils/upload";

export const runtime = "nodejs";

const resolveId = async (params) => String((await params)?.id || "").trim();

const resolveReportingCategory = async (categoryId) => {
  if (!categoryId) return null;
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
  });
  if (!category || category.category !== "REPORTING_WORK") return null;
  return category;
};

const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!Number.isNaN(date.getTime())) return date;
  }

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

const normalizeExistingMedia = (value) =>
  parseJsonArray(value).filter(
    (item) => typeof item === "string" && item.trim(),
  );

const serializeReport = (report, userId, isAdmin) => ({
  id: report.id,
  reportDate: report.reportDate,
  projectId: report.projectId,
  projectName: report.project?.name || "-",
  categoryId: report.categoryId || null,
  categoryName: report.category?.name || "-",
  description: report.description,
  imageUrls: Array.isArray(report.imageUrls) ? report.imageUrls : [],
  videoUrls: Array.isArray(report.videoUrls)
    ? report.videoUrls
    : [],
  videoUrl:
    Array.isArray(report.videoUrls) && report.videoUrls.length > 0
      ? report.videoUrls[0]
      : null,
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
      category: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!report) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Report not found." }, { status: 404 }),
    };
  }

  const isAdmin = gate.auth?.role === "Admin" || gate.auth?.role === "Manager";
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
    const categoryId = String(form.get("categoryId") || "").trim();
    const description = String(form.get("description") || "").trim();
    const parsedDate = parseDate(reportDate);

    if (!reportDate || !projectId || !categoryId || !description) {
      return NextResponse.json(
        {
          error:
            "Report date, project, reporting category and description are required.",
        },
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

    const category = await resolveReportingCategory(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: "Reporting category not found." },
        { status: 404 },
      );
    }

    const existingImages = normalizeExistingMedia(form.get("existingImages"));
    const existingVideoUrls = normalizeExistingMedia(
      form.get("existingVideoUrls"),
    );

    const imageFiles = form
      .getAll("images")
      .filter((value) => value instanceof File && value.size > 0);
    const newImages = await saveReportImages(imageFiles, projectId);
    const imageUrls = [...existingImages, ...newImages];

    const videoFiles = form
      .getAll("videos")
      .filter((value) => value instanceof File && value.size > 0);
    const newVideoUrls = await saveReportVideos(videoFiles, projectId);
    const videoUrls = [...existingVideoUrls, ...newVideoUrls];

    const updated = await prisma.dailyReport.update({
      where: { id: loaded.report.id },
      data: {
        reportDate: parsedDate,
        project: { connect: { id: projectId } },
        category: { connect: { id: categoryId } },
        description,
        imageUrls,
        videoUrls,
      },
      include: {
        project: { select: { name: true } },
        category: { select: { name: true } },
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
