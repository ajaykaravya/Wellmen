import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAYMENT_MODES = ["CASH", "BANK"];

const parsePayload = (body) => {
  const date = String(body.date || "").trim();
  const cashGivenToId = String(body.cashGivenToId || "").trim();
  const cashGivenById = String(body.cashGivenById || "").trim();
  const expenseCompanyId = String(
    body.expenseCompanyId || body.cashGivenFromCompanyId || "",
  ).trim();
  const amountRaw = String(body.amount || "").trim();
  const paymentMode = String(body.paymentMode || "")
    .trim()
    .toUpperCase();

  return {
    date,
    cashGivenToId,
    cashGivenById,
    expenseCompanyId,
    amountRaw,
    paymentMode,
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

const serializeCashIn = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  date: row.date,
  cashGivenToId: row.cashGivenToId,
  cashGivenToName: row.cashGivenTo?.fullName || null,
  cashGivenToRole: row.cashGivenTo?.role?.name || null,
  cashGivenById: row.cashGivenById,
  cashGivenByName: row.cashGivenBy?.fullName || null,
  cashGivenByRole: row.cashGivenBy?.role?.name || null,
  expenseCompanyId: row.expenseCompanyId,
  expenseCompanyName: row.expenseCompany?.name || null,
  expenseCompanyCode: row.expenseCompany?.code || null,
  cashGivenFromCompanyId: row.expenseCompanyId,
  cashGivenFromCompanyName: row.expenseCompany?.name || null,
  amount: Number(row.amount),
  paymentMode: row.paymentMode,
  remark: row.remark || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim();
  const paymentMode = String(searchParams.get("paymentMode") || "")
    .trim()
    .toUpperCase();
  const cashGivenToId = String(searchParams.get("cashGivenToId") || "").trim();
  const cashGivenById = String(searchParams.get("cashGivenById") || "").trim();
  const expenseCompanyId = String(
    searchParams.get("expenseCompanyId") ||
      searchParams.get("cashGivenFromCompanyId") ||
      "",
  ).trim();
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
      { cashGivenTo: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      { cashGivenTo: { is: { firstName: { contains: q, mode: "insensitive" } } } },
      { cashGivenTo: { is: { lastName: { contains: q, mode: "insensitive" } } } },
      { cashGivenBy: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      { cashGivenBy: { is: { firstName: { contains: q, mode: "insensitive" } } } },
      { cashGivenBy: { is: { lastName: { contains: q, mode: "insensitive" } } } },
      {
        expenseCompany: {
          is: { name: { contains: q, mode: "insensitive" } },
        },
      },
    ];
  }

  if (paymentMode) {
    if (!isValidPaymentMode(paymentMode)) {
      return NextResponse.json(
        { error: "Invalid payment mode filter." },
        { status: 400 },
      );
    }
    where.paymentMode = paymentMode;
  }

  if (cashGivenToId) where.cashGivenToId = cashGivenToId;
  if (cashGivenById) where.cashGivenById = cashGivenById;
  if (expenseCompanyId) where.expenseCompanyId = expenseCompanyId;

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

  where.transactionType = "CASH";

  const [total, cashIns] = await Promise.all([
    prisma.financeTransaction.count({ where }),
    prisma.financeTransaction.findMany({
      where,
      include: {
        cashGivenTo: { include: { role: true } },
        cashGivenBy: { include: { role: true } },
        expenseCompany: true,
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: cashIns.map(serializeCashIn),
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

  if (!isValidPaymentMode(payload.paymentMode)) {
    return NextResponse.json(
      { error: "Payment mode is required." },
      { status: 400 },
    );
  }

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!payload.cashGivenToId) {
    return NextResponse.json(
      { error: "Cash given to is required." },
      { status: 400 },
    );
  }

  if (!payload.cashGivenById) {
    return NextResponse.json(
      { error: "Cash given by is required." },
      { status: 400 },
    );
  }

  if (!payload.expenseCompanyId) {
    return NextResponse.json(
      { error: "Cash given from company is required." },
      { status: 400 },
    );
  }

  const [cashGivenTo, cashGivenBy, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.cashGivenToId },
      include: { role: true },
    }),
    prisma.user.findUnique({
      where: { id: payload.cashGivenById },
      include: { role: true },
    }),
    prisma.company.findUnique({ where: { id: payload.expenseCompanyId } }),
  ]);

  if (!cashGivenTo) {
    return NextResponse.json(
      { error: "Cash given to user not found." },
      { status: 404 },
    );
  }

  if (!cashGivenBy) {
    return NextResponse.json(
      { error: "Cash given by user not found." },
      { status: 404 },
    );
  }

  if (!["Admin", "Manager"].includes(cashGivenBy.role?.name || "")) {
    return NextResponse.json(
      { error: "Cash given by must be Admin or Manager." },
      { status: 400 },
    );
  }

  if (!company) {
    return NextResponse.json(
      { error: "Cash given from company not found." },
      { status: 404 },
    );
  }

  try {
    const cashIn = await prisma.financeTransaction.create({
      data: {
        transactionType: "CASH",
        date: parsedDate,
        cashGivenToId: cashGivenTo.id,
        cashGivenById: cashGivenBy.id,
        expenseCompanyId: company.id,
        amount: new Prisma.Decimal(amount),
        paymentMode: payload.paymentMode,
      },
      include: {
        cashGivenTo: { include: { role: true } },
        cashGivenBy: { include: { role: true } },
        expenseCompany: true,
      },
    });

    return NextResponse.json(serializeCashIn(cashIn), { status: 201 });
  } catch (error) {
    console.error("Failed to create cash", error);
    return NextResponse.json(
      { error: "Failed to create cash." },
      { status: 500 },
    );
  }
}
