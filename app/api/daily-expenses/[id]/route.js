import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT_RTGS"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const projectId = String(body.projectId || "").trim();
  const expenseTypeId = String(body.expenseTypeId || "").trim();
  const expenseById = String(body.expenseById || "").trim();
  const expenseCompanyId = String(body.expenseCompanyId || "").trim();
  const paymentMode = String(body.paymentMode || "")
    .trim()
    .toUpperCase();
  const date = String(body.date || "").trim();
  const remark = String(body.remark || "").trim();
  return {
    amountRaw,
    projectId,
    expenseTypeId,
    expenseById,
    expenseCompanyId,
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

const serializeDailyExpense = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  projectId: row.projectId,
  projectName: row.project?.name || null,
  projectCity: row.project?.city || null,
  expenseTypeId: row.expenseTypeId,
  expenseTypeName: row.expenseType?.name || null,
  expenseById: row.expenseById,
  expenseByName: row.expenseBy?.fullName || null,
  expenseCompanyId: row.expenseCompanyId,
  expenseCompanyName: row.expenseCompany?.name || null,
  expenseCompanyCode: row.expenseCompany?.code || null,
  paymentMode: row.paymentMode || null,
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
    include: {
      project: true,
      expenseType: true,
      expenseBy: true,
      expenseCompany: true,
    },
  });

  if (!dailyExpense) {
    return NextResponse.json(
      { error: "Daily expense not found." },
      { status: 404 },
    );
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

  if (!payload.projectId) {
    return NextResponse.json(
      { error: "Project is required." },
      { status: 400 },
    );
  }

  if (!isValidPaymentMode(payload.paymentMode)) {
    return NextResponse.json(
      { error: "Payment mode is required." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (!payload.expenseTypeId) {
    return NextResponse.json(
      { error: "Expense type is required." },
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

  if (!payload.expenseById) {
    return NextResponse.json(
      { error: "Expense by is required." },
      { status: 400 },
    );
  }

  const expenseBy = await prisma.user.findUnique({
    where: { id: payload.expenseById },
  });
  if (!expenseBy) {
    return NextResponse.json(
      { error: "Expense by user not found." },
      { status: 404 },
    );
  }

  if (!payload.expenseCompanyId) {
    return NextResponse.json(
      { error: "Expense company is required." },
      { status: 400 },
    );
  }

  const expenseCompany = await prisma.company.findUnique({
    where: { id: payload.expenseCompanyId },
  });
  if (!expenseCompany) {
    return NextResponse.json(
      { error: "Expense company not found." },
      { status: 404 },
    );
  }

  try {
    const dailyExpense = await prisma.dailyExpense.update({
      where: { id },
      data: {
        transactionType: "EXPENSE",
        amount: new Prisma.Decimal(amount),
        projectId: project.id,
        expenseTypeId: expenseType.id,
        expenseById: expenseBy.id,
        expenseCompanyId: expenseCompany.id,
        paymentMode: payload.paymentMode,
        date: parsedDate,
        remark: payload.remark || null,
      },
      include: {
        project: true,
        expenseType: true,
        expenseBy: true,
        expenseCompany: true,
      },
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
