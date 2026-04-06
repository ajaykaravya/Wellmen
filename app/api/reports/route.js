import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { saveReportImages, saveReportVideo } from "./_utils/upload";

export const runtime = "nodejs";

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TODO") return "TODO";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "DONE") return "DONE";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return null;
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

const getText = (form, key) => String(form.get(key) || "").trim();

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id || "";
  const isAdmin = gate.auth?.role === "Admin";

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
  const employeeId = String(searchParams.get("employeeId") || "").trim();
  const status = parseStatus(searchParams.get("status"));
  const date = searchParams.get("date");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {
    ...(isAdmin ? {} : { createdById: userId }),
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { project: { name: { contains: q, mode: "insensitive" } } },
      { createdBy: { firstName: { contains: q, mode: "insensitive" } } },
      { createdBy: { lastName: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (isAdmin && employeeId) {
    where.createdById = employeeId;
  }

  if (status) {
    where.status = status;
  }

  const parsedFromDate = parseDate(fromDate);
  const parsedToDate = parseDate(toDate);
  if (fromDate && !parsedFromDate) {
    return NextResponse.json({ error: "Invalid fromDate." }, { status: 400 });
  }
  if (toDate && !parsedToDate) {
    return NextResponse.json({ error: "Invalid toDate." }, { status: 400 });
  }

  if (parsedFromDate || parsedToDate) {
    where.reportDate = {};
    if (parsedFromDate) where.reportDate.gte = parsedFromDate;
    if (parsedToDate) {
      const end = new Date(parsedToDate);
      end.setHours(23, 59, 59, 999);
      where.reportDate.lte = end;
    }
  } else if (date) {
    const start = parseDate(date);
    if (!start) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    where.reportDate = {
      gte: start,
      lt: end,
    };
  }

  const [total, reports] = await Promise.all([
    prisma.dailyReport.count({ where }),
    prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: reports.map((report) => serializeReport(report, userId, isAdmin)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const isAdmin = gate.auth?.role === "Admin";
  if (isAdmin) {
    return NextResponse.json(
      { error: "Admin cannot add reporting. Only users can create reporting." },
      { status: 403 },
    );
  }

  try {
    const form = await req.formData();
    const reportDate = getText(form, "reportDate");
    const projectId = getText(form, "projectId");
    const title = getText(form, "title");
    const description = getText(form, "description");
    const status = parseStatus(form.get("status")) || "TODO";
    const parsedDate = parseDate(reportDate);

    if (!reportDate || !projectId || !title || !description) {
      return NextResponse.json(
        {
          error: "Report date, project, title and description are required.",
        },
        { status: 400 },
      );
    }

    if (!parsedDate) {
      return NextResponse.json({ error: "Invalid report date." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const imageFiles = form
      .getAll("images")
      .filter((value) => value instanceof File && value.size > 0);
    const videoInput = form.get("video");
    const videoFile = videoInput instanceof File && videoInput.size > 0 ? videoInput : null;

    const [imageUrls, videoUrl] = await Promise.all([
      saveReportImages(imageFiles),
      videoFile ? saveReportVideo(videoFile) : Promise.resolve(null),
    ]);

    const created = await prisma.dailyReport.create({
      data: {
        reportDate: parsedDate,
        projectId,
        title,
        description,
        status,
        imageUrls,
        videoUrl,
        createdById: gate.auth?.user?.id || null,
      },
      include: {
        project: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      serializeReport(created, gate.auth?.user?.id || "", false),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/reports failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create report." },
      { status: 500 },
    );
  }
}
