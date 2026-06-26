import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { buildInFilter, findIdsByMultiTableSearch } from "@/lib/mysql-search";

const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT_RTGS"];

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
  petiCashId: row.petiCashId || null,
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

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get("q") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
  const expenseTypeId = String(searchParams.get("expenseTypeId") || "").trim();
  const expenseById = String(searchParams.get("expenseById") || "").trim();
  const expenseCompanyId = String(
    searchParams.get("expenseCompanyId") || "",
  ).trim();
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

  const where = {};
  if (query) {
    Object.assign(
      where,
      buildInFilter(
        "id",
        await findIdsByMultiTableSearch({
          rootTable: "FinanceTransaction",
          query,
          equals: { transactionType: "EXPENSE" },
          joins: [
            {
              alias: "expenseType",
              table: "ExpenseType",
              left: { alias: "root", column: "expenseTypeId" },
              right: { column: "id" },
            },
            {
              alias: "expenseBy",
              table: "User",
              left: { alias: "root", column: "expenseById" },
              right: { column: "id" },
            },
            {
              alias: "expenseCompany",
              table: "Company",
              left: { alias: "root", column: "expenseCompanyId" },
              right: { column: "id" },
            },
            {
              alias: "project",
              table: "Project",
              left: { alias: "root", column: "projectId" },
              right: { column: "id" },
            },
          ],
          orSearch: [
            { alias: "root", column: "remark" },
            { alias: "expenseType", column: "name" },
            { alias: "expenseBy", column: "fullName" },
            { alias: "expenseBy", column: "firstName" },
            { alias: "expenseBy", column: "lastName" },
            { alias: "expenseCompany", column: "name" },
            { alias: "project", column: "name" },
            { alias: "project", column: "city" },
          ],
        }),
      ),
    );
  }
  where.transactionType = "EXPENSE";
  if (projectId) {
    where.projectId = projectId;
  }
  if (expenseTypeId) {
    where.expenseTypeId = expenseTypeId;
  }
  if (expenseById) {
    where.expenseById = expenseById;
  }
  if (expenseCompanyId) {
    where.expenseCompanyId = expenseCompanyId;
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

  const [total, dailyExpenses] = await Promise.all([
    prisma.financeTransaction.count({ where }),
    prisma.financeTransaction.findMany({
      where,
      include: {
        project: true,
        expenseType: true,
        expenseBy: true,
        expenseCompany: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: dailyExpenses.map(serializeDailyExpense),
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

  if (!payload.projectId) {
    return NextResponse.json(
      { error: "Project is required." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let expenseTypeId = null;
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
  expenseTypeId = expenseType.id;

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

  if (!isValidPaymentMode(payload.paymentMode)) {
    return NextResponse.json(
      { error: "Payment mode is required." },
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
    const dailyExpense = await prisma.financeTransaction.create({
      data: {
        transactionType: "EXPENSE",
        amount: new Prisma.Decimal(amount),
        projectId: project.id,
        expenseTypeId,
        expenseById: expenseBy.id,
        expenseCompanyId: expenseCompany.id,
        date: parsedDate,
        paymentMode: payload.paymentMode,
        remark: payload.remark || null,
      },
      include: {
        project: true,
        expenseType: true,
        expenseBy: true,
        expenseCompany: true,
      },
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
