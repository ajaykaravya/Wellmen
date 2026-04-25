import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
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

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  const contactNumber = String(body.contactNumber || "").trim();
  const email = String(body.email || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const description = String(body.description || "").trim();
  const status = parseStatus(body.status) || "PENDING";

  return {
    name,
    address,
    contactNumber,
    email,
    startDate,
    endDate,
    description,
    status,
  };
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const status = parseStatus(searchParams.get("status"));
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
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
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { contactNumber: { contains: q, mode: "insensitive" } },
    ];
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
    const filterStart = parsedFromDate
      ? new Date(parsedFromDate.setHours(0, 0, 0, 0))
      : null;
    const filterEnd = parsedToDate
      ? new Date(parsedToDate.setHours(23, 59, 59, 999))
      : null;

    const overlapConditions = [
      { startDate: { lte: filterEnd || filterStart } },
      {
        OR: [{ endDate: { gte: filterStart || filterEnd } }, { endDate: null }],
      },
    ];

    where.AND = overlapConditions;
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = projects.map((project) => ({
    id: project.id,
    name: project.name,
    address: project.address,
    contactNumber: project.contactNumber,
    email: project.email,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
  }));

  return NextResponse.json({
    data,
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
    !payload.name ||
    !payload.address ||
    !payload.contactNumber ||
    !payload.startDate
  ) {
    return NextResponse.json(
      {
        error:
          "Project name, address, contact number and start date are required.",
      },
      { status: 400 },
    );
  }

  const parsedStartDate = parseDate(payload.startDate);
  if (!parsedStartDate) {
    return NextResponse.json(
      { error: "Invalid start date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }

  const parsedEndDate = parseDate(payload.endDate);
  if (payload.endDate && !parsedEndDate) {
    return NextResponse.json(
      { error: "Invalid end date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }

  if (parsedEndDate && parsedEndDate < parsedStartDate) {
    return NextResponse.json(
      { error: "End date must be greater than or equal to start date." },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name: payload.name,
      address: payload.address,
      contactNumber: payload.contactNumber,
      email: payload.email,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      description: payload.description || null,
      status: payload.status,
      createdById: gate.auth?.user?.id || null,
    },
  });

  return NextResponse.json(
    {
      id: project.id,
      name: project.name,
      address: project.address,
      contactNumber: project.contactNumber,
      email: project.email,
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
    },
    { status: 201 },
  );
}
