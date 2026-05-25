import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const PAYMENT_MODES = ["CASH", "BANK"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const date = String(body.date || "").trim();
  const cashGivenToId = String(body.cashGivenToId || "").trim();
  const cashGivenById = String(body.cashGivenById || "").trim();
  const cashGivenFromCompanyId = String(body.cashGivenFromCompanyId || "").trim();
  const amountRaw = String(body.amount || "").trim();
  const paymentMode = String(body.paymentMode || "")
    .trim()
    .toUpperCase();

  return {
    date,
    cashGivenToId,
    cashGivenById,
    cashGivenFromCompanyId,
    amountRaw,
    paymentMode,
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

const serializeCashIn = (row) => ({
  id: row.id,
  date: row.date,
  cashGivenToId: row.cashGivenToId,
  cashGivenToName: row.cashGivenTo?.fullName || null,
  cashGivenToRole: row.cashGivenTo?.role?.name || null,
  cashGivenById: row.cashGivenById,
  cashGivenByName: row.cashGivenBy?.fullName || null,
  cashGivenByRole: row.cashGivenBy?.role?.name || null,
  cashGivenFromCompanyId: row.cashGivenFromCompanyId,
  cashGivenFromCompanyName: row.cashGivenFromCompany?.name || null,
  amount: Number(row.amount),
  paymentMode: row.paymentMode,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Cash id is required." },
      { status: 400 },
    );
  }

  const cashIn = await prisma.cashIn.findUnique({
    where: { id },
    include: {
      cashGivenTo: { include: { role: true } },
      cashGivenBy: { include: { role: true } },
      cashGivenFromCompany: true,
    },
  });

  if (!cashIn) {
    return NextResponse.json({ error: "Cash not found." }, { status: 404 });
  }

  return NextResponse.json(serializeCashIn(cashIn));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Cash id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const payload = parsePayload(body);

  const amount = Number(payload.amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount is required." }, { status: 400 });
  }

  if (!isValidPaymentMode(payload.paymentMode)) {
    return NextResponse.json(
      { error: "Payment mode is required." },
      { status: 400 },
    );
  }

  const parsedDate = parseDate(payload.date);
  if (!parsedDate) {
    return NextResponse.json({ error: "Date is required." }, { status: 400 });
  }

  const existing = await prisma.cashIn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cash not found." }, { status: 404 });
  }

  if (!payload.cashGivenToId) {
    return NextResponse.json(
      { error: "Cash given to is required." },
      { status: 400 },
    );
  }

  if (!payload.cashGivenById) {
    return NextResponse.json(
      { error: "Cash given by is required." },
      { status: 400 },
    );
  }

  if (!payload.cashGivenFromCompanyId) {
    return NextResponse.json(
      { error: "Cash given from company is required." },
      { status: 400 },
    );
  }

  const [cashGivenTo, cashGivenBy, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.cashGivenToId },
      include: { role: true },
    }),
    prisma.user.findUnique({
      where: { id: payload.cashGivenById },
      include: { role: true },
    }),
    prisma.company.findUnique({ where: { id: payload.cashGivenFromCompanyId } }),
  ]);

  if (!cashGivenTo) {
    return NextResponse.json(
      { error: "Cash given to user not found." },
      { status: 404 },
    );
  }

  if (!cashGivenBy) {
    return NextResponse.json(
      { error: "Cash given by user not found." },
      { status: 404 },
    );
  }

  if (!["Admin", "Manager"].includes(cashGivenBy.role?.name || "")) {
    return NextResponse.json(
      { error: "Cash given by must be Admin or Manager." },
      { status: 400 },
    );
  }

  if (!company) {
    return NextResponse.json(
      { error: "Cash given from company not found." },
      { status: 404 },
    );
  }

  try {
    const cashIn = await prisma.cashIn.update({
      where: { id },
      data: {
        date: parsedDate,
        cashGivenToId: cashGivenTo.id,
        cashGivenById: cashGivenBy.id,
        cashGivenFromCompanyId: company.id,
        amount: new Prisma.Decimal(amount),
        paymentMode: payload.paymentMode,
      },
      include: {
        cashGivenTo: { include: { role: true } },
        cashGivenBy: { include: { role: true } },
        cashGivenFromCompany: true,
      },
    });

    return NextResponse.json(serializeCashIn(cashIn));
  } catch (error) {
    console.error("Failed to update cash", error);
    return NextResponse.json(
      { error: "Failed to update cash." },
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
      { error: "Cash id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.cashIn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cash not found." }, { status: 404 });
  }

  await prisma.cashIn.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
