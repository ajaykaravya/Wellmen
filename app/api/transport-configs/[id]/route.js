import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  TRIP_TYPE_OPTIONS,
  TRANSPORT_CONFIG_TYPE_LABELS,
  buildCngTripConfigKey,
  buildCourierRateConfigKey,
  buildDriverWageConfigKey,
  buildFloorRentConfigKey,
  getTransportConfigTypeLabel,
  getTransportTypeLabel,
  isTransportType,
  parseDecimalValue,
  parseInteger,
} from "@/lib/transport-management";

const CONFIG_TYPES = Object.keys(TRANSPORT_CONFIG_TYPE_LABELS);
const SUPPORTED_TRANSPORT_TYPES_BY_CONFIG = {
  DRIVER_WAGE_SLAB: ["BOLERO_DELIVERY", "BOLERO_RETURN_DC"],
  FLOOR_RENT: ["BOLERO_DELIVERY", "BOLERO_RETURN_DC"],
  COURIER_WEIGHT_RATE: ["COURIER_DAILY"],
  COURIER_COVER_RATE: ["COURIER_DAILY"],
  CNG_TRIP_SLAB: ["CNG_RICKSHAW"],
};

const resolveId = async (params) => String((await params)?.id || "").trim();

const parsePayload = (body) => ({
  transportType: String(body.transportType || "").trim().toUpperCase(),
  configType: String(body.configType || "").trim().toUpperCase(),
  floor: String(body.floor || "").trim(),
  loadType: String(body.loadType || "").trim(),
  tripType: String(body.tripType || "").trim(),
  minKm: parseInteger(body.minKm),
  maxKm: parseInteger(body.maxKm),
  rate: parseDecimalValue(body.rate),
});

const getSupportedTransportTypes = (configType) =>
  SUPPORTED_TRANSPORT_TYPES_BY_CONFIG[configType] ?? [];

const getConfigKey = (payload) => {
  switch (payload.configType) {
    case "DRIVER_WAGE_SLAB":
      return buildDriverWageConfigKey(payload.minKm, payload.maxKm);
    case "FLOOR_RENT":
      return buildFloorRentConfigKey(payload.floor, payload.loadType);
    case "COURIER_WEIGHT_RATE":
      return buildCourierRateConfigKey("weight");
    case "COURIER_COVER_RATE":
      return buildCourierRateConfigKey("cover");
    case "CNG_TRIP_SLAB":
      return buildCngTripConfigKey(payload.tripType, payload.minKm, payload.maxKm);
    default:
      return "-";
  }
};

const validatePayload = (payload) => {
  if (!payload.transportType) return "Transport type is required.";
  if (!isTransportType(payload.transportType)) return "Invalid transport type.";
  if (!payload.configType) return "Config type is required.";
  if (!CONFIG_TYPES.includes(payload.configType)) return "Invalid config type.";
  if (!getSupportedTransportTypes(payload.configType).includes(payload.transportType)) {
    return "This transport type is not enabled for the selected config type.";
  }

  switch (payload.configType) {
    case "DRIVER_WAGE_SLAB":
      if (payload.minKm === null || payload.maxKm === null) {
        return "Min KM and Max KM are required.";
      }
      if (payload.minKm < 0 || payload.maxKm < 0) {
        return "KM values must be zero or greater.";
      }
      if (payload.maxKm < payload.minKm) {
        return "Max KM cannot be less than Min KM.";
      }
      break;
    case "FLOOR_RENT":
      if (!payload.floor) return "Floor is required.";
      if (!FLOOR_OPTIONS.includes(payload.floor)) return "Invalid floor option.";
      if (!payload.loadType) return "Load type is required.";
      if (!LOAD_TYPE_OPTIONS.includes(payload.loadType)) return "Invalid load type option.";
      break;
    case "COURIER_WEIGHT_RATE":
    case "COURIER_COVER_RATE":
      break;
    case "CNG_TRIP_SLAB":
      if (!payload.tripType) return "Trip type is required.";
      if (!TRIP_TYPE_OPTIONS.includes(payload.tripType)) return "Invalid trip type option.";
      if (payload.minKm === null || payload.maxKm === null) {
        return "Min KM and Max KM are required.";
      }
      if (payload.minKm < 0 || payload.maxKm < 0) {
        return "KM values must be zero or greater.";
      }
      if (payload.maxKm < payload.minKm) {
        return "Max KM cannot be less than Min KM.";
      }
      break;
    default:
      return "Unsupported config type.";
  }

  if (payload.rate === null) return "Rate is required.";
  return null;
};

const serializeConfig = (config) => ({
  id: config.id,
  transportType: config.transportType,
  configType: config.configType,
  configTypeLabel: getTransportConfigTypeLabel(config.configType),
  transportTypeLabel: getTransportTypeLabel(config.transportType),
  configKey: config.configKey,
  floor: config.floor || null,
  loadType: config.loadType || null,
  minKm: config.minKm ?? null,
  maxKm: config.maxKm ?? null,
  tripType: config.tripType || null,
  rate: Number(config.rate || 0),
  isActive: config.isActive,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
});

export async function GET(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Transport config id is required." },
      { status: 400 },
    );
  }

  const config = await prisma.transportConfig.findUnique({ where: { id } });
  if (!config) {
    return NextResponse.json(
      { error: "Transport config not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(serializeConfig(config));
}

export async function PUT(req, { params }) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const id = await resolveId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Transport config id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.transportConfig.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Transport config not found." },
      { status: 404 },
    );
  }

  const payload = parsePayload(await req.json());
  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const configKey = getConfigKey(payload);

  try {
    const updated = await prisma.transportConfig.update({
      where: { id },
      data: {
        transportType: payload.transportType,
        configType: payload.configType,
        configKey,
        configData: {
          floor: payload.floor || null,
          loadType: payload.loadType || null,
          minKm: payload.minKm,
          maxKm: payload.maxKm,
          tripType: payload.tripType || null,
        },
        floor: payload.floor || null,
        loadType: payload.loadType || null,
        minKm: payload.minKm,
        maxKm: payload.maxKm,
        tripType: payload.tripType || null,
        rate: new Prisma.Decimal(payload.rate),
      },
    });

    return NextResponse.json(serializeConfig(updated));
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A config for this transport rule already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to update transport config", error);
    return NextResponse.json(
      { error: "Failed to update transport config." },
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
      { error: "Transport config id is required." },
      { status: 400 },
    );
  }

  const existing = await prisma.transportConfig.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Transport config not found." },
      { status: 404 },
    );
  }

  await prisma.transportConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
