import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAYMENT_MODES = ["CASH", "BANK"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const projectId = String(body.projectId || "").trim();
  const incomeCompanyId = String(body.incomeCompanyId || body.expenseCompanyId || "").trim();
  const receivedById = String(body.receivedById || body.expenseById || "").trim();
  const paymentMode = String(body.paymentMode || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const remark = String(body.remark || "").trim();

  return {
    amountRaw,
    projectId,
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
  incomeCompanyId: row.expenseCompanyId,
  incomeCompanyName: row.expenseCompany?.name || null,
  receivedById: row.expenseById,
  receivedByName: row.expenseBy?.fullName || null,
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
      { error: "Income id is required." },
      { status: 400 },
    );
  }

  const income = await prisma.dailyExpense.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, city: true } },
      expenseCompany: true,
      expenseBy: { include: { role: true } },
    },
  });

  if (!income || income.transactionType !== "INCOME") {
    return NextResponse.json({ error: "Income not found." }, { status: 404 });
  }

  return NextResponse.json(serializeIncome(income));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Income id is required." },
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
  if (!existing || existing.transactionType !== "INCOME") {
    return NextResponse.json({ error: "Income not found." }, { status: 404 });
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

  const [project, incomeCompany, receivedBy] = await Promise.all([
    prisma.project.findUnique({
      where: { id: payload.projectId },
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
    const income = await prisma.dailyExpense.update({
      where: { id },
      data: {
        transactionType: "INCOME",
        amount: new Prisma.Decimal(amount),
        projectId: project.id,
        expenseCompanyId: incomeCompany.id,
        expenseById: receivedBy.id,
        paymentMode: payload.paymentMode,
        date: parsedDate,
        remark: payload.remark || null,
      },
      include: {
        project: { select: { id: true, name: true, city: true } },
        expenseCompany: true,
        expenseBy: { include: { role: true } },
      },
    });

    return NextResponse.json(serializeIncome(income));
  } catch (error) {
    console.error("Failed to update income", error);
    return NextResponse.json(
      { error: "Failed to update income." },
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
      { error: "Income id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.dailyExpense.findUnique({ where: { id } });
  if (!existing || existing.transactionType !== "INCOME") {
    return NextResponse.json({ error: "Income not found." }, { status: 404 });
  }

  await prisma.dailyExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
