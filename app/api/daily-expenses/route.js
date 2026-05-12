import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const TRANSACTION_TYPES = ["INCOME", "EXPENSE"];

const parsePayload = (body) => {
  const transactionType = String(body.transactionType || "")
    .trim()
    .toUpperCase();
  const amountRaw = String(body.amount || "").trim();
  const expenseTypeId = String(body.expenseTypeId || "").trim();
  const date = String(body.date || "").trim();
  const remark = String(body.remark || "").trim();
  return {
    transactionType,
    amountRaw,
    expenseTypeId,
    date,
    remark,
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

const serializeDailyExpense = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  expenseTypeId: row.expenseTypeId,
  expenseTypeName: row.expenseType?.name || null,
  date: row.date,
  remark: row.remark,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const transactionType = String(searchParams.get("transactionType") || "")
    .trim()
    .toUpperCase();
  const expenseTypeId = String(searchParams.get("expenseTypeId") || "").trim();
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
      { remark: { contains: query, mode: "insensitive" } },
      { expenseType: { name: { contains: query, mode: "insensitive" } } },
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
  if (expenseTypeId) {
    where.expenseTypeId = expenseTypeId;
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

  const [total, dailyExpenses, incomeSum, expenseSum] = await Promise.all([
    prisma.dailyExpense.count({ where }),
    prisma.dailyExpense.findMany({
      where,
      include: { expenseType: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dailyExpense.aggregate({
      _sum: { amount: true },
      where: { transactionType: "INCOME" },
    }),
    prisma.dailyExpense.aggregate({
      _sum: { amount: true },
      where: { transactionType: "EXPENSE" },
    }),
  ]);

  const income = Number(incomeSum._sum.amount || 0);
  const expense = Number(expenseSum._sum.amount || 0);
  const balance = income - expense;

  return NextResponse.json({
    data: dailyExpenses.map(serializeDailyExpense),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    balance,
  });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const payload = parsePayload(body);

  if (!isValidTransactionType(payload.transactionType)) {
    return NextResponse.json(
      { error: "Transaction type is required." },
      { status: 400 },
    );
  }

  const amount = Number(payload.amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount is required." }, { status: 400 });
  }

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  let expenseTypeId = null;
  if (payload.transactionType === "EXPENSE") {
    if (!payload.expenseTypeId) {
      return NextResponse.json(
        { error: "Expense type is required for expense transactions." },
        { status: 400 },
      );
    }

    const expenseType = await prisma.expenseType.findUnique({
      where: { id: payload.expenseTypeId },
    });
    if (!expenseType) {
      return NextResponse.json(
        { error: "Expense type not found." },
        { status: 404 },
      );
    }
    expenseTypeId = expenseType.id;
  }

  try {
    const dailyExpense = await prisma.dailyExpense.create({
      data: {
        transactionType: payload.transactionType,
        amount: new Prisma.Decimal(amount),
        expenseTypeId,
        date: parsedDate,
        remark: payload.remark || null,
      },
      include: { expenseType: true },
    });

    return NextResponse.json(serializeDailyExpense(dailyExpense), {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create daily expense", error);
    return NextResponse.json(
      { error: "Failed to create daily expense." },
      { status: 500 },
    );
  }
}
