import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const TRANSACTION_TYPES = ["CREDIT", "DEBIT"];

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const transactionType = String(body.transactionType || "")
    .trim()
    .toUpperCase();
  const givenById = String(body.givenById || "").trim();
  const givenToId = String(body.givenToId || "").trim();
  const companyId = String(body.companyId || "").trim();
  const projectId = String(body.projectId || "").trim();
  const expenseTypeId = String(body.expenseTypeId || "").trim();
  const date = String(body.date || "").trim();
  const remarks = String(body.remarks || "").trim();

  return {
    amountRaw,
    transactionType,
    givenById,
    givenToId,
    companyId,
    projectId,
    expenseTypeId,
    date,
    remarks,
  };
};

const isValidTransactionType = (value) => TRANSACTION_TYPES.includes(value);

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

const serializePetiCash = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  givenById: row.givenById,
  givenByName: row.givenBy?.fullName || null,
  givenByRole: row.givenBy?.role?.name || null,
  givenToId: row.givenToId,
  givenToName: row.givenTo?.fullName || null,
  givenToRole: row.givenTo?.role?.name || null,
  companyId: row.companyId,
  companyName: row.company?.name || null,
  companyCode: row.company?.code || null,
  projectId: row.projectId,
  projectName: row.project?.name || null,
  projectCity: row.project?.city || null,
  expenseTypeId: row.expenseTypeId,
  expenseTypeName: row.expenseType?.name || null,
  date: row.date,
  remarks: row.remarks || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const validateRolePair = (transactionType, givenBy, givenTo) => {
  if (transactionType === "CREDIT") {
    if (givenBy.role?.name !== "Admin") {
      return "Given by must be Admin for Add Cash.";
    }
    if (givenTo.role?.name !== "Manager") {
      return "Given to must be Manager for Add Cash.";
    }
    return null;
  }

  if (givenBy.role?.name !== "Manager") {
    return "Given by must be Manager for Give Cash.";
  }
  return null;
};

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
    include: {
      givenBy: { include: { role: true } },
      givenTo: { include: { role: true } },
      company: true,
      project: true,
      expenseType: true,
    },
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

  const existing = await prisma.petiCash.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Peti cash not found." }, { status: 404 });
  }

  const body = await req.json();
  const payload = parsePayload(body);

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
      ? prisma.expenseType.findUnique({ where: { id: payload.expenseTypeId } })
      : Promise.resolve(null),
  ]);

  if (!givenBy) {
    return NextResponse.json({ error: "Given by user not found." }, { status: 404 });
  }

  if (!givenTo) {
    return NextResponse.json({ error: "Given to user not found." }, { status: 404 });
  }

  const roleError = validateRolePair(payload.transactionType, givenBy, givenTo);
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
    const petiCash = await prisma.petiCash.update({
      where: { id },
      data: {
        amount: new Prisma.Decimal(amount),
        transactionType: payload.transactionType,
        givenById: givenBy.id,
        givenToId: givenTo.id,
        companyId: company.id,
        projectId: project?.id || null,
        expenseTypeId:
          payload.transactionType === "DEBIT" ? expenseType.id : null,
        date: parsedDate,
        remarks: payload.remarks || null,
      },
      include: {
        givenBy: { include: { role: true } },
        givenTo: { include: { role: true } },
        company: true,
        project: true,
        expenseType: true,
      },
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
