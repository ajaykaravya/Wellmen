import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const TRANSACTION_TYPES = ["INCOME", "EXPENSE"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const isValidTransactionType = (value) => TRANSACTION_TYPES.includes(value);

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

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Daily expense id is required." },
      { status: 400 },
    );
  }

  const dailyExpense = await prisma.dailyExpense.findUnique({
    where: { id },
    include: { expenseType: true },
  });

  if (!dailyExpense) {
    return NextResponse.json({ error: "Daily expense not found." }, { status: 404 });
  }

  return NextResponse.json(serializeDailyExpense(dailyExpense));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Daily expense id is required." },
      { status: 400 },
    );
  }

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

  const existing = await prisma.dailyExpense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Daily expense not found." },
      { status: 404 },
    );
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
    const dailyExpense = await prisma.dailyExpense.update({
      where: { id },
      data: {
        transactionType: payload.transactionType,
        amount: new Prisma.Decimal(amount),
        expenseTypeId,
        date: parsedDate,
        remark: payload.remark || null,
      },
      include: { expenseType: true },
    });

    return NextResponse.json(serializeDailyExpense(dailyExpense));
  } catch (error) {
    console.error("Failed to update daily expense", error);
    return NextResponse.json(
      { error: "Failed to update daily expense." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Daily expense id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.dailyExpense.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Daily expense not found." },
      { status: 404 },
    );
  }

  await prisma.dailyExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
