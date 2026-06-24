import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  PETI_CASH_INCLUDE,
  isValidPaymentMode,
  isValidTransactionType,
  parseDate,
  parsePetiCashPayload,
  serializePetiCash,
  syncLinkedDailyExpense,
  validatePetiCashParticipants,
} from "./_shared";

const summarizeCompanyBalances = async (where) => {
  const grouped = await prisma.petiCash.groupBy({
    by: ["companyId", "transactionType"],
    where,
    _sum: { amount: true },
  });

  const companyIds = [
    ...new Set(grouped.map((item) => item.companyId).filter(Boolean)),
  ];

  const companies = companyIds.length
    ? await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true, code: true },
      })
    : [];

  const companyMap = new Map(companies.map((company) => [company.id, company]));

  return grouped.reduce((acc, item) => {
    const company = item.companyId ? companyMap.get(item.companyId) : null;
    const companyKey = company?.code || company?.name || item.companyId || "Unknown";

    if (!acc[companyKey]) {
      acc[companyKey] = { credit: 0, debit: 0, balance: 0 };
    }

    if (item.transactionType === "CREDIT") {
      acc[companyKey].credit += Number(item._sum.amount || 0);
    } else {
      acc[companyKey].debit += Number(item._sum.amount || 0);
    }

    acc[companyKey].balance = acc[companyKey].credit - acc[companyKey].debit;
    return acc;
  }, {});
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const summaryType = String(searchParams.get("summary") || "").trim();
  const query = String(searchParams.get("q") || "").trim();
  const transactionType = String(searchParams.get("transactionType") || "")
    .trim()
    .toUpperCase();
  const givenById = String(searchParams.get("givenById") || "").trim();
  const givenToId = String(searchParams.get("givenToId") || "").trim();
  const companyId = String(searchParams.get("companyId") || "").trim();
  const projectId = String(searchParams.get("projectId") || "").trim();
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
      { remarks: { contains: query } },
      { givenBy: { is: { fullName: { contains: query } } } },
      { givenBy: { is: { firstName: { contains: query } } } },
      { givenBy: { is: { lastName: { contains: query } } } },
      { givenTo: { is: { fullName: { contains: query } } } },
      { givenTo: { is: { firstName: { contains: query } } } },
      { givenTo: { is: { lastName: { contains: query } } } },
      { company: { is: { name: { contains: query } } } },
      { project: { is: { name: { contains: query } } } },
      { project: { is: { city: { contains: query } } } },
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

  if (givenById) where.givenById = givenById;
  if (givenToId) where.givenToId = givenToId;
  if (companyId) where.companyId = companyId;
  if (projectId) where.projectId = projectId;

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

  if (summaryType === "companyBalance") {
    const balances = await summarizeCompanyBalances(where);
    return NextResponse.json({ balances });
  }

  const [total, petiCash] = await Promise.all([
    prisma.petiCash.count({ where }),
    prisma.petiCash.findMany({
      where,
      include: PETI_CASH_INCLUDE,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: petiCash.map(serializePetiCash),
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
  const payload = parsePetiCashPayload(body);

  const amount = Number(payload.amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount is required." }, { status: 400 });
  }

  if (!isValidTransactionType(payload.transactionType)) {
    return NextResponse.json(
      { error: "Transaction type is required." },
      { status: 400 },
    );
  }

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  if (!payload.givenById) {
    return NextResponse.json({ error: "Given by is required." }, { status: 400 });
  }

  if (!payload.givenToId) {
    return NextResponse.json({ error: "Given to is required." }, { status: 400 });
  }

  if (!payload.companyId) {
    return NextResponse.json({ error: "Company is required." }, { status: 400 });
  }

  if (payload.transactionType === "DEBIT" && !payload.expenseTypeId) {
    return NextResponse.json(
      { error: "Expense category is required." },
      { status: 400 },
    );
  }

  if (payload.transactionType === "DEBIT" && !payload.isAdvance) {
    if (!payload.paymentMode) {
      return NextResponse.json(
        { error: "Payment mode is required." },
        { status: 400 },
      );
    }
    if (!isValidPaymentMode(payload.paymentMode)) {
      return NextResponse.json(
        { error: "Invalid payment mode." },
        { status: 400 },
      );
    }
  }

  const [givenBy, givenTo, company, project, expenseType] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.givenById },
      include: { role: true },
    }),
    prisma.user.findUnique({
      where: { id: payload.givenToId },
      include: { role: true },
    }),
    prisma.company.findUnique({ where: { id: payload.companyId } }),
    payload.projectId
      ? prisma.project.findUnique({ where: { id: payload.projectId } })
      : Promise.resolve(null),
    payload.expenseTypeId
      ? prisma.expenseType.findUnique({
          where: { id: payload.expenseTypeId },
          include: {
            expenseTypeUsers: {
              include: {
                user: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  if (!givenBy) {
    return NextResponse.json({ error: "Given by user not found." }, { status: 404 });
  }

  if (!givenTo) {
    return NextResponse.json({ error: "Given to user not found." }, { status: 404 });
  }

  const roleError = validatePetiCashParticipants({
    transactionType: payload.transactionType,
    isAdvance: payload.isAdvance,
    givenBy,
    givenTo,
    expenseType,
  });
  if (roleError) {
    return NextResponse.json({ error: roleError }, { status: 400 });
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  if (payload.projectId && !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (payload.transactionType === "DEBIT" && !expenseType) {
    return NextResponse.json(
      { error: "Expense category not found." },
      { status: 404 },
    );
  }

  try {
    const petiCash = await prisma.$transaction(async (tx) => {
      const created = await tx.petiCash.create({
        data: {
          amount: new Prisma.Decimal(amount),
          transactionType: payload.transactionType,
          isAdvance:
            payload.transactionType === "DEBIT" ? payload.isAdvance : true,
          givenById: givenBy.id,
          givenToId: givenTo.id,
          companyId: company.id,
          projectId: project?.id || null,
          expenseTypeId:
            payload.transactionType === "DEBIT" ? expenseType.id : null,
          date: parsedDate,
          remarks: payload.remarks || null,
        },
      });

      await syncLinkedDailyExpense({
        tx,
        petiCashId: created.id,
        existingDailyExpense: null,
        transactionType: payload.transactionType,
        isAdvance: payload.transactionType === "DEBIT" ? payload.isAdvance : true,
        amount: new Prisma.Decimal(amount),
        givenToId: givenTo.id,
        companyId: company.id,
        projectId: project?.id || null,
        expenseTypeId: payload.transactionType === "DEBIT" ? expenseType.id : null,
        paymentMode:
          payload.transactionType === "DEBIT" && !payload.isAdvance
            ? payload.paymentMode
            : null,
        date: parsedDate,
        remarks: payload.remarks || null,
      });

      return tx.petiCash.findUnique({
        where: { id: created.id },
        include: PETI_CASH_INCLUDE,
      });
    });

    return NextResponse.json(serializePetiCash(petiCash), { status: 201 });
  } catch (error) {
    console.error("Failed to create peti cash", error);
    return NextResponse.json(
      { error: "Failed to create peti cash." },
      { status: 500 },
    );
  }
}
