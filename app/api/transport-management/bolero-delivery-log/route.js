import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  calculateDriverWages,
  calculateFloorRent,
  calculateTotalAmount,
  calculateTotalKm,
  isFloorType,
  isLocationType,
  isLoadType,
} from "@/lib/boleroDeliveryLog";

const parseDate = (value) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0,
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDecimal = (value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePayload = (body) => {
  const tripDate = String(body.tripDate || "").trim();
  const tripDescription = String(body.tripDescription || "").trim();
  const locationType = String(body.locationType || "").trim();
  const city = String(body.city || "").trim();
  const floor = String(body.floor || "").trim();
  const kmStartRaw = String(body.kmStart ?? "").trim();
  const kmEndRaw = String(body.kmEnd ?? "").trim();
  const loadType = String(body.loadType || "").trim();
  const otherExpensesRaw = String(body.otherExpenses ?? "0").trim();
  const dcNumber = String(body.dcNumber || "").trim();
  const remark = String(body.remark || "").trim();

  return {
    tripDate,
    tripDescription,
    locationType,
    city,
    floor,
    kmStartRaw,
    kmEndRaw,
    loadType,
    otherExpensesRaw,
    dcNumber,
    remark,
  };
};

const serializeBoleroDeliveryLog = (row) => ({
  id: row.id,
  tripDate: row.tripDate,
  tripDescription: row.tripDescription,
  locationType: row.locationType,
  city: row.city,
  floor: row.floor,
  kmStart: Number(row.kmStart),
  kmEnd: Number(row.kmEnd),
  totalKm: Number(row.totalKm),
  loadType: row.loadType,
  driverWages: Number(row.driverWages),
  otherExpenses: Number(row.otherExpenses),
  floorRent: Number(row.floorRent),
  totalAmount: Number(row.totalAmount),
  dcNumber: row.dcNumber,
  remark: row.remark,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const locationType = String(searchParams.get("locationType") || "").trim();
  const floor = String(searchParams.get("floor") || "").trim();
  const loadType = String(searchParams.get("loadType") || "").trim();
  const fromDate = String(searchParams.get("fromDate") || "").trim();
  const toDate = String(searchParams.get("toDate") || "").trim();
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = {};

  if (q) {
    where.OR = [
      { tripDescription: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { dcNumber: { contains: q, mode: "insensitive" } },
      { remark: { contains: q, mode: "insensitive" } },
      { locationType: { contains: q, mode: "insensitive" } },
      { floor: { contains: q, mode: "insensitive" } },
      { loadType: { contains: q, mode: "insensitive" } },
    ];
  }

  if (locationType) {
    if (!isLocationType(locationType)) {
      return NextResponse.json(
        { error: "Invalid location type filter." },
        { status: 400 },
      );
    }
    where.locationType = locationType;
  }

  if (floor) {
    if (!isFloorType(floor)) {
      return NextResponse.json({ error: "Invalid floor filter." }, { status: 400 });
    }
    where.floor = floor;
  }

  if (loadType) {
    if (!isLoadType(loadType)) {
      return NextResponse.json(
        { error: "Invalid load type filter." },
        { status: 400 },
      );
    }
    where.loadType = loadType;
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
    const filterStart = parsedFromDate
      ? new Date(parsedFromDate.setHours(0, 0, 0, 0))
      : null;
    const filterEnd = parsedToDate
      ? new Date(parsedToDate.setHours(23, 59, 59, 999))
      : null;

    where.tripDate = {};
    if (filterStart) where.tripDate.gte = filterStart;
    if (filterEnd) where.tripDate.lte = filterEnd;
  }

  const [total, rows] = await Promise.all([
    prisma.boleroDeliveryLog.count({ where }),
    prisma.boleroDeliveryLog.findMany({
      where,
      orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: rows.map(serializeBoleroDeliveryLog),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const payload = parsePayload(body);

  if (
    !payload.tripDate ||
    !payload.tripDescription ||
    !payload.locationType ||
    !payload.floor ||
    !payload.kmStartRaw ||
    !payload.kmEndRaw ||
    !payload.loadType
  ) {
    return NextResponse.json(
      {
        error:
          "Trip date, trip description, location type, floor, KM start, KM end and load type are required.",
      },
      { status: 400 },
    );
  }

  if (!isLocationType(payload.locationType)) {
    return NextResponse.json(
      { error: "Invalid location type." },
      { status: 400 },
    );
  }

  if (!isFloorType(payload.floor)) {
    return NextResponse.json({ error: "Invalid floor." }, { status: 400 });
  }

  if (!isLoadType(payload.loadType)) {
    return NextResponse.json({ error: "Invalid load type." }, { status: 400 });
  }

  const parsedTripDate = parseDate(payload.tripDate);
  if (!parsedTripDate) {
    return NextResponse.json(
      { error: "Invalid trip date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }

  const kmStart = parseDecimal(payload.kmStartRaw);
  const kmEnd = parseDecimal(payload.kmEndRaw);
  const otherExpenses = parseDecimal(payload.otherExpensesRaw) ?? 0;

  if (kmStart === null || kmEnd === null) {
    return NextResponse.json(
      { error: "KM start and KM end are required." },
      { status: 400 },
    );
  }

  const totalKm = calculateTotalKm(kmStart, kmEnd);
  const driverWages = calculateDriverWages(totalKm);
  const floorRent = calculateFloorRent(payload.floor, payload.loadType);
  const totalAmount = calculateTotalAmount({
    driverWages,
    otherExpenses,
    floorRent,
  });

  const row = await prisma.boleroDeliveryLog.create({
    data: {
      tripDate: parsedTripDate,
      tripDescription: payload.tripDescription,
      locationType: payload.locationType,
      city: payload.city || null,
      floor: payload.floor,
      kmStart: new Prisma.Decimal(kmStart),
      kmEnd: new Prisma.Decimal(kmEnd),
      totalKm: new Prisma.Decimal(totalKm),
      loadType: payload.loadType,
      driverWages: new Prisma.Decimal(driverWages),
      otherExpenses: new Prisma.Decimal(otherExpenses),
      floorRent: new Prisma.Decimal(floorRent),
      totalAmount: new Prisma.Decimal(totalAmount),
      dcNumber: payload.dcNumber || null,
      remark: payload.remark || null,
    },
  });

  return NextResponse.json(serializeBoleroDeliveryLog(row), { status: 201 });
}
