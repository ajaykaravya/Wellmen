import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT_RTGS"];

const parsePayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const projectId = String(body.projectId || "").trim();
  const incomeTypeId = String(body.incomeTypeId || "").trim();
  const incomeCompanyId = String(
    body.incomeCompanyId || body.expenseCompanyId || "",
  ).trim();
  const receivedById = String(body.receivedById || body.expenseById || "").trim();
  const paymentMode = String(body.paymentMode || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const remark = String(body.remark || "").trim();

  return {
    amountRaw,
    projectId,
    incomeTypeId,
    incomeCompanyId,
    receivedById,
    paymentMode,
    date,
    remark,
  };
};

const isValidPaymentMode = (value) => PAYMENT_MODES.includes(value);

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

const serializeIncome = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  projectId: row.projectId,
  projectName: row.project?.name || null,
  projectCity: row.project?.city || null,
  incomeTypeId: row.incomeTypeId,
  incomeTypeName: row.incomeType?.name || null,
  incomeCompanyId: row.incomeCompanyId,
  incomeCompanyName: row.incomeCompany?.name || null,
  incomeCompanyCode: row.incomeCompany?.code || null,
  receivedById: row.receivedById,
  receivedByName: row.receivedBy?.fullName || null,
  paymentMode: row.paymentMode || null,
  date: row.date,
  remark: row.remark,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
  const incomeTypeId = String(searchParams.get("incomeTypeId") || "").trim();
  const incomeCompanyId = String(searchParams.get("incomeCompanyId") || "").trim();
  const receivedById = String(searchParams.get("receivedById") || "").trim();
  const paymentMode = String(searchParams.get("paymentMode") || "")
    .trim()
    .toUpperCase();
  const fromDate = String(searchParams.get("fromDate") || "").trim();
  const toDate = String(searchParams.get("toDate") || "").trim();
  const pageParam = Number(searchParams.get("page") || "1");
  const pageSizeParam = Number(searchParams.get("pageSize") || "10");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, 100)
      : 10;

  const where = { transactionType: "INCOME" };
  if (q) {
    where.OR = [
      { remark: { contains: q, mode: "insensitive" } },
      { incomeType: { name: { contains: q, mode: "insensitive" } } },
      { project: { is: { name: { contains: q, mode: "insensitive" } } } },
      { project: { is: { city: { contains: q, mode: "insensitive" } } } },
      { incomeCompany: { is: { name: { contains: q, mode: "insensitive" } } } },
      { receivedBy: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      { receivedBy: { is: { firstName: { contains: q, mode: "insensitive" } } } },
      { receivedBy: { is: { lastName: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (projectId) where.projectId = projectId;
  if (incomeTypeId) where.incomeTypeId = incomeTypeId;
  if (incomeCompanyId) where.incomeCompanyId = incomeCompanyId;
  if (receivedById) where.receivedById = receivedById;

  if (paymentMode) {
    if (!isValidPaymentMode(paymentMode)) {
      return NextResponse.json(
        { error: "Invalid payment mode filter." },
        { status: 400 },
      );
    }
    where.paymentMode = paymentMode;
  }

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

  const [total, incomes] = await Promise.all([
    prisma.incomeTransaction.count({ where }),
    prisma.incomeTransaction.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, city: true } },
        incomeType: true,
        incomeCompany: true,
        receivedBy: { include: { role: true } },
      },
      orderBy: [{ date: "desc" }, { date: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: incomes.map(serializeIncome),
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

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!payload.incomeTypeId) {
    return NextResponse.json({ error: "Category is required." }, { status: 400 });
  }

  if (!payload.projectId) {
    return NextResponse.json({ error: "Project is required." }, { status: 400 });
  }

  if (!payload.incomeCompanyId) {
    return NextResponse.json(
      { error: "Income company is required." },
      { status: 400 },
    );
  }

  if (!payload.receivedById) {
    return NextResponse.json(
      { error: "Received by is required." },
      { status: 400 },
    );
  }

  if (!isValidPaymentMode(payload.paymentMode)) {
    return NextResponse.json(
      { error: "Payment mode is required." },
      { status: 400 },
    );
  }

  const [project, incomeType, incomeCompany, receivedBy] = await Promise.all([
    prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { id: true },
    }),
    prisma.incomeType.findUnique({
      where: { id: payload.incomeTypeId },
      select: { id: true },
    }),
    prisma.company.findUnique({
      where: { id: payload.incomeCompanyId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: payload.receivedById },
      select: { id: true },
    }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (!incomeType) {
    return NextResponse.json(
      { error: "Income type not found." },
      { status: 404 },
    );
  }

  if (!incomeCompany) {
    return NextResponse.json(
      { error: "Income company not found." },
      { status: 404 },
    );
  }

  if (!receivedBy) {
    return NextResponse.json(
      { error: "Received by user not found." },
      { status: 404 },
    );
  }

  try {
    const income = await prisma.incomeTransaction.create({
      data: {
        transactionType: "INCOME",
        amount: new Prisma.Decimal(amount),
        projectId: project.id,
        incomeTypeId: incomeType.id,
        incomeCompanyId: incomeCompany.id,
        receivedById: receivedBy.id,
        paymentMode: payload.paymentMode,
        date: parsedDate,
        remark: payload.remark || null,
      },
      include: {
        project: { select: { id: true, name: true, city: true } },
        incomeType: true,
        incomeCompany: true,
        receivedBy: { include: { role: true } },
      },
    });

    return NextResponse.json(serializeIncome(income), { status: 201 });
  } catch (error) {
    console.error("Failed to create income", error);
    return NextResponse.json(
      { error: "Failed to create income." },
      { status: 500 },
    );
  }
}
