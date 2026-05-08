import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const resolveId = async (params) => String((await params)?.id || "").trim();

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return null;
};

const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyyMatch = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parsePayload = (body) => {
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  const city = String(body.city || "").trim();
  const contactNumber = String(body.contactNumber || "").trim();
  const email = String(body.email || "").trim();
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const description = String(body.description || "").trim();
  const status = parseStatus(body.status) || "PENDING";

  return {
    name,
    address,
    city,
    contactNumber,
    email,
    startDate,
    endDate,
    description,
    status,
  };
};

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Project id is required." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    address: project.address,
    city: project.city,
    contactNumber: project.contactNumber,
    email: project.email,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
  });
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Project id is required." },
      { status: 400 },
    );
  }

  const body = await req.json();
  const payload = parsePayload(body);

  if (
    !payload.name ||
    !payload.address ||
    !payload.city ||
    !payload.contactNumber ||
    !payload.startDate
  ) {
    return NextResponse.json(
      {
        error:
          "Project name, address, city, contact number and start date are required.",
      },
      { status: 400 },
    );
  }

  const parsedStartDate = parseDate(payload.startDate);
  if (!parsedStartDate) {
    return NextResponse.json(
      { error: "Invalid start date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }

  const parsedEndDate = parseDate(payload.endDate);
  if (payload.endDate && !parsedEndDate) {
    return NextResponse.json(
      { error: "Invalid end date. Use DD/MM/YYYY." },
      { status: 400 },
    );
  }

  if (parsedEndDate && parsedEndDate < parsedStartDate) {
    return NextResponse.json(
      { error: "End date must be greater than or equal to start date." },
      { status: 400 },
    );
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: payload.name,
      address: payload.address,
      city: payload.city,
      contactNumber: payload.contactNumber,
      email: payload.email,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      description: payload.description || null,
      status: payload.status,
    },
  });

  return NextResponse.json({
    id: project.id,
    name: project.name,
    address: project.address,
    city: project.city,
    contactNumber: project.contactNumber,
    email: project.email,
    startDate: project.startDate,
    endDate: project.endDate,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt,
  });
}

export async function DELETE(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Project id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
