import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  buildTransportRecord,
  serializeTransportLog,
  transportSearchFields,
} from "./_utils";
import { isTransportType } from "@/lib/transport-management";

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildSearchWhere = (query) => {
  if (!query) return null;

  return {
    OR: transportSearchFields.map((field) => ({
      [field]: { contains: query },
    })),
  };
};

const buildDateWhere = (fromDate, toDate) => {
  if (!fromDate && !toDate) return null;

  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if ((fromDate && !from) || (toDate && !to)) {
    throw new Error("Invalid date filter.");
  }

  const dateWhere = {};
  if (from) {
    from.setHours(0, 0, 0, 0);
    dateWhere.gte = from;
  }
  if (to) {
    to.setHours(23, 59, 59, 999);
    dateWhere.lte = to;
  }

  return dateWhere;
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  try {
    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const transportType = String(searchParams.get("transportType") || "")
      .trim()
      .toUpperCase();
    const status = String(searchParams.get("status") || "").trim();
    const paymentMode = String(searchParams.get("paymentMode") || "").trim();
    const fromDate = String(searchParams.get("fromDate") || "").trim();
    const toDate = String(searchParams.get("toDate") || "").trim();
    const locationType = String(searchParams.get("locationType") || "").trim();
    const loadType = String(searchParams.get("loadType") || "").trim();
    const tripType = String(searchParams.get("tripType") || "").trim();
    const vehicleType = String(searchParams.get("vehicleType") || "").trim();
    const pageParam = Number(searchParams.get("page") || "1");
    const pageSizeParam = Number(searchParams.get("pageSize") || "10");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(pageSizeParam, 100)
        : 10;

    const where = {};
    if (q) {
      Object.assign(where, buildSearchWhere(q));
    }
    if (transportType) {
      if (!isTransportType(transportType)) {
        return NextResponse.json(
          { error: "Invalid transport type filter." },
          { status: 400 },
        );
      }
      where.transportType = transportType;
    }
    if (status) {
      where.status = status;
    }
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }
    if (locationType) {
      where.locationType = locationType;
    }
    if (loadType) {
      where.loadType = loadType;
    }
    if (tripType) {
      where.tripType = tripType;
    }
    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    const dateWhere = buildDateWhere(fromDate, toDate);
    if (dateWhere) {
      where.date = dateWhere;
    }

    const [total, rows] = await Promise.all([
      prisma.transportLog.count({ where }),
      prisma.transportLog.findMany({
        where,
        orderBy: [{ date: "desc" }, { serialNo: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: rows.map(serializeTransportLog),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Failed to load transport logs", error);
    return NextResponse.json(
      { error: error.message || "Failed to load transport logs." },
      { status: 400 },
    );
  }
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  try {
    const body = await req.json();
    const record = await buildTransportRecord(body);

    const created = await prisma.$transaction(async (tx) => {
      const maxSerial = await tx.transportLog.aggregate({
        _max: { serialNo: true },
        where: { transportType: record.transportType },
      });
      const serialNo = (maxSerial._max.serialNo || 0) + 1;

      return tx.transportLog.create({
        data: {
          ...record,
          serialNo,
          createdById: gate.auth?.user?.id || null,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
    });

    return NextResponse.json(serializeTransportLog(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create transport log", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transport log." },
      { status: 400 },
    );
  }
}
