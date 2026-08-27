import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const toNumber = (value) => Number(value ?? 0) || 0;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// YYYY-MM-DD in local terms, used as the grouping key for the date-wise view.
const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const dateFilter = {};
  if (from) dateFilter.gte = from;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }
  const where = {
    projectId: id,
    ...(from || to ? { date: dateFilter } : {}),
  };

  // Peti cash claims are mirrored into FinanceTransaction, so reading expenses
  // from that table alone covers them without double counting.
  const [incomeRows, expenseRows] = await Promise.all([
    prisma.incomeTransaction.findMany({
      where,
      include: { incomeType: true, incomeCompany: true, receivedBy: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.financeTransaction.findMany({
      where,
      include: { expenseType: true, expenseCompany: true, expenseBy: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const income = incomeRows.map((row) => ({
    id: row.id,
    date: row.date,
    amount: toNumber(row.amount),
    categoryName: row.incomeType?.name || null,
    companyName: row.incomeCompany?.name || null,
    personName: row.receivedBy?.fullName || null,
    paymentMode: row.paymentMode,
    remark: row.remark,
  }));

  const expenses = expenseRows.map((row) => ({
    id: row.id,
    date: row.date,
    amount: toNumber(row.amount),
    categoryName: row.expenseType?.name || null,
    companyName: row.expenseCompany?.name || null,
    personName: row.expenseBy?.fullName || null,
    paymentMode: row.paymentMode,
    remark: row.remark,
    fromPetiCash: Boolean(row.petiCashId),
  }));

  const buckets = new Map();
  const bucketFor = (key) => {
    if (!buckets.has(key)) buckets.set(key, { date: key, income: 0, expense: 0 });
    return buckets.get(key);
  };
  income.forEach((row) => {
    bucketFor(dateKey(row.date)).income += row.amount;
  });
  expenses.forEach((row) => {
    bucketFor(dateKey(row.date)).expense += row.amount;
  });

  const byDate = [...buckets.values()]
    .map((row) => ({ ...row, net: row.income - row.expense }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalIncome = income.reduce((sum, row) => sum + row.amount, 0);
  const totalExpense = expenses.reduce((sum, row) => sum + row.amount, 0);

  return NextResponse.json({
    data: {
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        city: project.city,
        contactNumber: project.contactNumber,
        email: project.email,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        description: project.description,
      },
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        incomeCount: income.length,
        expenseCount: expenses.length,
      },
      byDate,
      income,
      expenses,
    },
  });
}
