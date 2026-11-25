import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// Account reports (Reports > Expense Report / Income Report).
//
//   GET /api/account-reports?kind=expense|income
//     &fromDate=DD/MM/YYYY&toDate=DD/MM/YYYY   (inclusive, Indian time)
//     &projectId=<id>|none &companyId &categoryId &personId &paymentMode
//     &source=direct|claim   (expense only)
//     &q=<text>              (searches remarks)
//
// Expenses are FinanceTransaction rows of type EXPENSE. That includes expense
// claims made through petty cash (they create a linked row with petiCashId);
// `source` separates them. Petty-cash advances are not expenses and never
// appear here. Income is every IncomeTransaction row.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT_RTGS"];
const MAX_ROWS = 10000;

// Start of a DD/MM/YYYY (or YYYY-MM-DD) day in Indian time, as a UTC instant.
const parseIstDayStart = (value) => {
  const text = String(value || "").trim();
  let y, m, d;
  let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) [, d, m, y] = match.map(Number);
  else if ((match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text))) [, y, m, d] = match.map(Number);
  else return null;
  const utc = Date.UTC(y, m - 1, d);
  const check = new Date(utc);
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return new Date(utc - IST_OFFSET_MS);
};

const projectRef = (project) =>
  project ? { id: project.id, name: project.name, city: project.city || null } : null;

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const param = (key) => String(searchParams.get(key) || "").trim();

  const kind = param("kind").toLowerCase();
  if (kind !== "expense" && kind !== "income") {
    return NextResponse.json(
      { error: "kind must be expense or income." },
      { status: 400 },
    );
  }

  const fromDate = param("fromDate");
  const toDate = param("toDate");
  const from = fromDate ? parseIstDayStart(fromDate) : null;
  const toStart = toDate ? parseIstDayStart(toDate) : null;
  if ((fromDate && !from) || (toDate && !toStart)) {
    return NextResponse.json(
      { error: "Invalid date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }
  if (from && toStart && from > toStart) {
    return NextResponse.json(
      { error: "From date must be on or before To date." },
      { status: 400 },
    );
  }

  const paymentMode = param("paymentMode").toUpperCase();
  if (paymentMode && !PAYMENT_MODES.includes(paymentMode)) {
    return NextResponse.json({ error: "Invalid payment mode." }, { status: 400 });
  }

  const projectId = param("projectId");
  const companyId = param("companyId");
  const categoryId = param("categoryId");
  const personId = param("personId");
  const source = param("source").toLowerCase();
  const q = param("q");

  const where = {};
  if (from || toStart) {
    where.date = {};
    if (from) where.date.gte = from;
    // "To" is inclusive: everything before the start of the following day.
    if (toStart) where.date.lt = new Date(toStart.getTime() + DAY_MS);
  }
  if (projectId) where.projectId = projectId === "none" ? null : projectId;
  if (paymentMode) where.paymentMode = paymentMode;
  if (q) where.remark = { contains: q };

  try {
    let rows;
    if (kind === "expense") {
      where.transactionType = "EXPENSE";
      if (companyId) where.expenseCompanyId = companyId;
      if (categoryId) where.expenseTypeId = categoryId;
      if (personId) where.expenseById = personId;
      if (source === "direct") where.petiCashId = null;
      if (source === "claim") where.petiCashId = { not: null };

      const data = await prisma.financeTransaction.findMany({
        where,
        include: {
          project: true,
          expenseType: true,
          expenseCompany: true,
          expenseBy: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: MAX_ROWS + 1,
      });
      rows = data.map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        project: projectRef(row.project),
        categoryId: row.expenseTypeId,
        categoryName: row.expenseType?.name || null,
        companyId: row.expenseCompanyId,
        companyName: row.expenseCompany?.name || null,
        companyCode: row.expenseCompany?.code || null,
        personId: row.expenseById,
        personName: row.expenseBy?.fullName || null,
        paymentMode: row.paymentMode || null,
        source: row.petiCashId ? "CLAIM" : "DIRECT",
        remark: row.remark || null,
        createdAt: row.createdAt,
      }));
    } else {
      if (companyId) where.incomeCompanyId = companyId;
      if (categoryId) where.incomeTypeId = categoryId;
      if (personId) where.receivedById = personId;

      const data = await prisma.incomeTransaction.findMany({
        where,
        include: {
          project: true,
          incomeType: true,
          incomeCompany: true,
          receivedBy: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: MAX_ROWS + 1,
      });
      rows = data.map((row) => ({
        id: row.id,
        date: row.date,
        amount: Number(row.amount),
        project: projectRef(row.project),
        categoryId: row.incomeTypeId,
        categoryName: row.incomeType?.name || null,
        companyId: row.incomeCompanyId,
        companyName: row.incomeCompany?.name || null,
        companyCode: row.incomeCompany?.code || null,
        personId: row.receivedById,
        personName: row.receivedBy?.fullName || null,
        paymentMode: row.paymentMode || null,
        source: null,
        remark: row.remark || null,
        createdAt: row.createdAt,
      }));
    }

    const truncated = rows.length > MAX_ROWS;
    if (truncated) rows = rows.slice(0, MAX_ROWS);

    // Totals in paise to avoid floating-point drift over many rows.
    const totalPaise = rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);

    return NextResponse.json({
      kind,
      data: rows,
      total: rows.length,
      totalAmount: totalPaise / 100,
      truncated,
    });
  } catch (error) {
    console.error("GET account report failed", error);
    return NextResponse.json(
      { error: "Failed to load report." },
      { status: 500 },
    );
  }
}
