import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const TRANSACTION_TYPES = ["CREDIT", "DEBIT"];

const parsePayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const transactionType = String(body.transactionType || "")
    .trim()
    .toUpperCase();
  const givenById = String(body.givenById || "").trim();
  const givenToId = String(body.givenToId || "").trim();
  const companyId = String(body.companyId || "").trim();
  const projectId = String(body.projectId || "").trim();
  const date = String(body.date || "").trim();
  const remarks = String(body.remarks || "").trim();

  return {
    amountRaw,
    transactionType,
    givenById,
    givenToId,
    companyId,
    projectId,
    date,
    remarks,
  };
};

const isValidTransactionType = (value) => TRANSACTION_TYPES.includes(value);

const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
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

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const serializePetiCash = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  givenById: row.givenById,
  givenByName: row.givenBy?.fullName || null,
  givenByRole: row.givenBy?.role?.name || null,
  givenToId: row.givenToId,
  givenToName: row.givenTo?.fullName || null,
  givenToRole: row.givenTo?.role?.name || null,
  companyId: row.companyId,
  companyName: row.company?.name || null,
  companyCode: row.company?.code || null,
  projectId: row.projectId,
  projectName: row.project?.name || null,
  projectCity: row.project?.city || null,
  date: row.date,
  remarks: row.remarks || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const validateRolePair = (transactionType, givenBy, givenTo) => {
  if (transactionType === "CREDIT") {
    if (givenBy.role?.name !== "Admin") {
      return "Given by must be Admin for Add Cash.";
    }
    if (givenTo.role?.name !== "Manager") {
      return "Given to must be Manager for Add Cash.";
    }
    return null;
  }

  if (givenBy.role?.name !== "Manager") {
    return "Given by must be Manager for Give Cash.";
  }
  if (givenTo.role?.name === "Admin" || givenTo.role?.name === "Manager") {
    return "Given to must be Employee for Give Cash.";
  }
  return null;
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const transactionType = String(searchParams.get("transactionType") || "")
    .trim()
    .toUpperCase();
  const givenById = String(searchParams.get("givenById") || "").trim();
  const givenToId = String(searchParams.get("givenToId") || "").trim();
  const companyId = String(searchParams.get("companyId") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
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

  if (query) {
    where.OR = [
      { remarks: { contains: query, mode: "insensitive" } },
      { givenBy: { is: { fullName: { contains: query, mode: "insensitive" } } } },
      { givenBy: { is: { firstName: { contains: query, mode: "insensitive" } } } },
      { givenBy: { is: { lastName: { contains: query, mode: "insensitive" } } } },
      { givenTo: { is: { fullName: { contains: query, mode: "insensitive" } } } },
      { givenTo: { is: { firstName: { contains: query, mode: "insensitive" } } } },
      { givenTo: { is: { lastName: { contains: query, mode: "insensitive" } } } },
      { company: { is: { name: { contains: query, mode: "insensitive" } } } },
      { project: { is: { name: { contains: query, mode: "insensitive" } } } },
      { project: { is: { city: { contains: query, mode: "insensitive" } } } },
    ];
  }

  if (transactionType) {
    if (!isValidTransactionType(transactionType)) {
      return NextResponse.json(
        { error: "Invalid transaction type filter." },
        { status: 400 },
      );
    }
    where.transactionType = transactionType;
  }

  if (givenById) where.givenById = givenById;
  if (givenToId) where.givenToId = givenToId;
  if (companyId) where.companyId = companyId;
  if (projectId) where.projectId = projectId;

  if (fromDate || toDate) {
    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if ((fromDate && !from) || (toDate && !to)) {
      return NextResponse.json(
        { error: "Invalid date filter." },
        { status: 400 },
      );
    }
    where.date = {};
    if (from) {
      from.setHours(0, 0, 0, 0);
      where.date.gte = from;
    }
    if (to) {
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }
  }

  const [total, petiCash] = await Promise.all([
    prisma.petiCash.count({ where }),
    prisma.petiCash.findMany({
      where,
      include: {
        givenBy: { include: { role: true } },
        givenTo: { include: { role: true } },
        company: true,
        project: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: petiCash.map(serializePetiCash),
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

  const amount = Number(payload.amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount is required." }, { status: 400 });
  }

  if (!isValidTransactionType(payload.transactionType)) {
    return NextResponse.json(
      { error: "Transaction type is required." },
      { status: 400 },
    );
  }

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!payload.givenById) {
    return NextResponse.json({ error: "Given by is required." }, { status: 400 });
  }

  if (!payload.givenToId) {
    return NextResponse.json({ error: "Given to is required." }, { status: 400 });
  }

  if (!payload.companyId) {
    return NextResponse.json({ error: "Company is required." }, { status: 400 });
  }

  const [givenBy, givenTo, company, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.givenById },
      include: { role: true },
    }),
    prisma.user.findUnique({
      where: { id: payload.givenToId },
      include: { role: true },
    }),
    prisma.company.findUnique({ where: { id: payload.companyId } }),
    payload.projectId
      ? prisma.project.findUnique({ where: { id: payload.projectId } })
      : Promise.resolve(null),
  ]);

  if (!givenBy) {
    return NextResponse.json({ error: "Given by user not found." }, { status: 404 });
  }

  if (!givenTo) {
    return NextResponse.json({ error: "Given to user not found." }, { status: 404 });
  }

  const roleError = validateRolePair(payload.transactionType, givenBy, givenTo);
  if (roleError) {
    return NextResponse.json({ error: roleError }, { status: 400 });
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  if (payload.projectId && !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  try {
    const petiCash = await prisma.petiCash.create({
      data: {
        amount: new Prisma.Decimal(amount),
        transactionType: payload.transactionType,
        givenById: givenBy.id,
        givenToId: givenTo.id,
        companyId: company.id,
        projectId: project?.id || null,
        date: parsedDate,
        remarks: payload.remarks || null,
      },
      include: {
        givenBy: { include: { role: true } },
        givenTo: { include: { role: true } },
        company: true,
        project: true,
      },
    });

    return NextResponse.json(serializePetiCash(petiCash), { status: 201 });
  } catch (error) {
    console.error("Failed to create peti cash", error);
    return NextResponse.json(
      { error: "Failed to create peti cash." },
      { status: 500 },
    );
  }
}
