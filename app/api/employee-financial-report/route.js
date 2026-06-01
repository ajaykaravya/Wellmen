import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const REPORT_ROLES = ["Admin", "Manager"];

const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyy = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
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

const serializeUser = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
  role: user.role?.name || null,
});

const isReportEligibleRole = (roleName) =>
  roleName !== "Admin" && roleName !== "Manager";

const buildDateWhere = (fromDate, toDate) => {
  if (!fromDate && !toDate) return null;

  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if ((fromDate && !from) || (toDate && !to)) return null;

  const where = {};
  if (from) {
    from.setHours(0, 0, 0, 0);
    where.gte = from;
  }
  if (to) {
    to.setHours(23, 59, 59, 999);
    where.lte = to;
  }
  return where;
};

const toTime = (value) => {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const normalizeLedgerRow = (row) => ({
  id: row.id,
  sourceType: row.sourceType,
  date: row.date,
  createdAt: row.createdAt,
  typeLabel: row.sourceType === "PETI_CASH" ? "Peti Cash" : "Expense",
  referenceLabel: row.referenceLabel,
  cashGivenByLabel: row.cashGivenByLabel || null,
  sourceSubTypeLabel: row.sourceSubTypeLabel || null,
  projectName: row.projectName || null,
  projectCity: row.projectCity || null,
  companyName: row.companyName || null,
  companyCode: row.companyCode || null,
  credit: Number(row.credit || 0),
  debit: Number(row.debit || 0),
  remarks: row.remarks || null,
});

export async function GET(req) {
  const gate = await requireRole(req, REPORT_ROLES);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const userId = String(searchParams.get("userId") || "").trim();
  const companyId = String(searchParams.get("companyId") || "").trim();
  const fromDate = String(searchParams.get("fromDate") || "").trim();
  const toDate = String(searchParams.get("toDate") || "").trim();

  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const employeeUsers = users
    .filter((user) => isReportEligibleRole(user.role?.name || ""))
    .map(serializeUser);

  if (!userId) {
    return NextResponse.json({
      users: employeeUsers,
      selectedUser: null,
      data: [],
      total: 0,
      summary: {
        totalGivenTo: 0,
        totalExpenseBy: 0,
        balance: 0,
      },
    });
  }

  const selectedUser = employeeUsers.find((user) => user.id === userId);
  if (!selectedUser) {
    return NextResponse.json(
      { error: "Selected user not found." },
      { status: 404 },
    );
  }

  const dateWhere = buildDateWhere(fromDate, toDate);
  if ((fromDate || toDate) && !dateWhere) {
    return NextResponse.json(
      { error: "Invalid date filter." },
      { status: 400 },
    );
  }

  const petiCashWhere = {
    givenToId: userId,
  };
  if (companyId) petiCashWhere.companyId = companyId;
  if (dateWhere) petiCashWhere.date = dateWhere;

  const expenseWhere = {
    transactionType: "EXPENSE",
    expenseById: userId,
  };
  if (companyId) expenseWhere.expenseCompanyId = companyId;
  if (dateWhere) expenseWhere.date = dateWhere;

  const [petiCashRows, expenseRows] = await Promise.all([
    prisma.petiCash.findMany({
      where: petiCashWhere,
      include: {
        givenBy: { select: { fullName: true } },
        project: { select: { name: true, city: true } },
        company: { select: { name: true, code: true } },
      },
    }),
    prisma.financeTransaction.findMany({
      where: expenseWhere,
      include: {
        expenseType: { select: { name: true } },
        expenseCompany: { select: { name: true, code: true } },
        project: { select: { name: true, city: true } },
      },
    }),
  ]);

  const normalizedRows = [
    ...petiCashRows.map((row) => ({
      id: `pc_${row.id}`,
      sourceId: row.id,
      sourceType: "PETI_CASH",
      date: row.date,
      createdAt: row.createdAt,
      referenceLabel: "",
      cashGivenByLabel: row.givenBy?.fullName || "-",
      sourceSubTypeLabel:
        row.transactionType === "CREDIT"
          ? "Credit"
          : row.transactionType === "DEBIT"
            ? "Debit"
            : null,
      projectName: row.project?.name || null,
      projectCity: row.project?.city || null,
      companyName: row.company?.name || null,
      companyCode: row.company?.code || null,
      credit: Number(row.amount),
      debit: 0,
      remarks: row.remarks || null,
    })),
    ...expenseRows.map((row) => ({
      id: `exp_${row.id}`,
      sourceId: row.id,
      sourceType: "EXPENSE",
      date: row.date,
      createdAt: row.createdAt,
      referenceLabel: row.expenseType?.name || "-",
      cashGivenByLabel: null,
      projectName: row.project?.name || null,
      projectCity: row.project?.city || null,
      companyName: row.expenseCompany?.name || null,
      companyCode: row.expenseCompany?.code || null,
      credit: 0,
      debit: Number(row.amount),
      remarks: row.remark || null,
    })),
  ].sort((a, b) => {
    const dateDiff = toTime(a.date) - toTime(b.date);
    if (dateDiff !== 0) return dateDiff;
    const createdDiff = toTime(a.createdAt) - toTime(b.createdAt);
    if (createdDiff !== 0) return createdDiff;
    return a.sourceType === b.sourceType ? 0 : a.sourceType === "PETI_CASH" ? -1 : 1;
  });

  let runningBalance = 0;
  const rowsWithBalance = normalizedRows.map((row) => {
    runningBalance += Number(row.credit || 0) - Number(row.debit || 0);
    return {
      ...row,
      runningBalance,
    };
  });

  const totalGivenTo = rowsWithBalance.reduce(
    (sum, row) => sum + Number(row.credit || 0),
    0,
  );
  const totalExpenseBy = rowsWithBalance.reduce(
    (sum, row) => sum + Number(row.debit || 0),
    0,
  );
  const balance = totalGivenTo - totalExpenseBy;
  const total = rowsWithBalance.length;

  const rowsForResponse = [...rowsWithBalance].sort((a, b) => {
    const dateDiff = toTime(b.date) - toTime(a.date);
    if (dateDiff !== 0) return dateDiff;
    const createdDiff = toTime(b.createdAt) - toTime(a.createdAt);
    if (createdDiff !== 0) return createdDiff;
    return a.sourceType === b.sourceType ? 0 : a.sourceType === "PETI_CASH" ? -1 : 1;
  });

  return NextResponse.json({
    users: employeeUsers,
    selectedUser,
    data: rowsForResponse.map(normalizeLedgerRow).map((row) => ({
      ...row,
      runningBalance:
        rowsWithBalance.find((entry) => entry.id === row.id)?.runningBalance || 0,
    })),
    total,
    summary: {
      totalGivenTo,
      totalExpenseBy,
      balance,
    },
  });
}
