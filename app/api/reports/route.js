import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { saveReportImages, saveReportVideos } from "./_utils/upload";
import { firestore } from "@/lib/firebase-admin";
import { sendPushToTokens } from "@/lib/pushNotifications";
import {
  buildReportWhatsAppMessage,
  sendWhatsAppTextToMany,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

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

const serializeReport = (report, userId, isAdmin) => ({
  id: report.id,
  reportDate: report.reportDate,
  projectId: report.projectId,
  projectName: report.project?.name || "-",
  projectCity: report.project?.city || null,
  categoryId: report.categoryId || null,
  categoryName: report.category?.name || "-",
  description: report.description,
  imageUrls: Array.isArray(report.imageUrls) ? report.imageUrls : [],
  videoUrls: Array.isArray(report.videoUrls) ? report.videoUrls : [],
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

const getText = (form, key) => String(form.get(key) || "").trim();

const getDisplayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.fullName ||
  "Unknown User";

export async function GET(req) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id || "";
  const isAdmin = gate.auth?.role === "Admin" || gate.auth?.role === "Manager";

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
  const employeeId = String(searchParams.get("employeeId") || "").trim();
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
      { description: { contains: q, mode: "insensitive" } },
      { project: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
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
        project: { select: { name: true, city: true } },
        category: { select: { name: true } },
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

  const isAdmin = gate.auth?.role === "Admin" || gate.auth?.role === "Manager";
  if (isAdmin) {
    return NextResponse.json(
      {
        error:
          "Admin and Manager cannot add reporting. Only users can create reporting.",
      },
      { status: 403 },
    );
  }

  try {
    const form = await req.formData();
    const reportDate = getText(form, "reportDate");
    const projectId = getText(form, "projectId");
    const categoryId = getText(form, "categoryId");
    const description = getText(form, "description");
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

    const imageFiles = form
      .getAll("images")
      .filter((value) => value instanceof File && value.size > 0);
    const videoFiles = form
      .getAll("videos")
      .filter((value) => value instanceof File && value.size > 0);

    const [imageUrls, videoUrls] = await Promise.all([
      saveReportImages(imageFiles, projectId),
      saveReportVideos(videoFiles, projectId),
    ]);

    const userId = gate.auth?.user?.id;
    const creatorName = getDisplayName(gate.auth?.user);
    const created = await prisma.dailyReport.create({
      data: {
        reportDate: parsedDate,
        project: { connect: { id: projectId } },
        category: { connect: { id: categoryId } },
        description,
        imageUrls,
        videoUrls,
        ...(userId && { createdBy: { connect: { id: userId } } }),
      },
      include: {
        project: { select: { name: true, city: true } },
        category: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    // 🔹 Get Admin + Manager users
    const recipients = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ["Admin", "Manager"],
          },
        },
      },
      select: {
        id: true,
        mobileNumber: true,
        firstName: true,
        lastName: true,
      },
    });

    // 🔹 Send notifications
    if (firestore) {
      await Promise.allSettled(
        recipients.map((recipient) =>
          firestore
            .collection("notifications")
            .doc(recipient.id)
            .collection("items")
            .add({
              title: "New Report",
              message: `${created.category?.name || "-"}\nNew report for ${created.project.name} has been submitted by ${creatorName}`,
              createdAt: new Date(),
              isRead: false,
              reportId: created.id,
            }),
        ),
      );
    }

    const hasDeviceTokens = await prisma.deviceToken.count({
      where: { isActive: true },
    });

    if (hasDeviceTokens > 0) {
      const activeTokens = await prisma.deviceToken.findMany({
        where: {
          isActive: true,
          user: {
            role: {
              name: {
                in: ["Admin", "Manager"],
              },
            },
          },
        },
        select: { token: true },
      });

      if (activeTokens.length > 0) {
        try {
          const pushResult = await sendPushToTokens(
            activeTokens.map((item) => item.token),
            {
              title: "New Report",
              body: `${created.category?.name || "-"}\nNew report for ${created.project.name} has been submitted by ${creatorName}`,
              data: {
                reportId: created.id,
                projectId: created.projectId,
                screen: "report",
              },
            },
          );

          if (pushResult.invalidTokens.length > 0) {
            await prisma.deviceToken.updateMany({
              where: {
                token: {
                  in: pushResult.invalidTokens,
                },
              },
              data: {
                isActive: false,
              },
            });
          }
        } catch (pushError) {
          console.error("Push notification delivery failed", pushError);
        }
      }
    }

    const whatsAppRecipients = recipients
      .map((recipient) => recipient.mobileNumber)
      .filter(Boolean);

    if (whatsAppRecipients.length > 0) {
      try {
        const whatsappResult = await sendWhatsAppTextToMany(
          whatsAppRecipients,
          buildReportWhatsAppMessage(created, creatorName),
        );

        if (whatsappResult.failureCount > 0) {
          console.warn("WhatsApp delivery completed with failures", {
            sentCount: whatsappResult.sentCount,
            failureCount: whatsappResult.failureCount,
          });
        }
      } catch (whatsappError) {
        console.error("WhatsApp notification delivery failed", whatsappError);
      }
    }

    return NextResponse.json(
      serializeReport(created, gate.auth?.user?.id || "", false),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/reports failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create report.",
      },
      { status: 500 },
    );
  }
}
