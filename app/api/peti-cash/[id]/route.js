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
} from "../_shared";

const resolveId = async (params) => String((await params)?.id || "").trim();


export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Peti cash id is required." },
      { status: 400 },
    );
  }

  const petiCash = await prisma.petiCash.findUnique({
    where: { id },
    include: PETI_CASH_INCLUDE,
  });

  if (!petiCash) {
    return NextResponse.json({ error: "Peti cash not found." }, { status: 404 });
  }

  return NextResponse.json(serializePetiCash(petiCash));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Peti cash id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.petiCash.findUnique({
    where: { id },
    include: PETI_CASH_INCLUDE,
  });
  if (!existing) {
    return NextResponse.json({ error: "Peti cash not found." }, { status: 404 });
  }

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
      await syncLinkedDailyExpense({
        tx,
        petiCashId: id,
        existingDailyExpense: existing.dailyExpense || null,
        transactionType: payload.transactionType,
        isAdvance:
          payload.transactionType === "DEBIT" ? payload.isAdvance : true,
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

      const updated = await tx.petiCash.update({
        where: { id },
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

      return tx.petiCash.findUnique({
        where: { id: updated.id },
        include: PETI_CASH_INCLUDE,
      });
    });

    return NextResponse.json(serializePetiCash(petiCash));
  } catch (error) {
    console.error("Failed to update peti cash", error);
    return NextResponse.json(
      { error: "Failed to update peti cash." },
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
      { error: "Peti cash id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.petiCash.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Peti cash not found." }, { status: 404 });
  }

  await prisma.petiCash.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
