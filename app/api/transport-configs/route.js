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

const isSupportedConfigType = (value) => CONFIG_TYPES.includes(value);

const parsePayload = (body) => {
  const transportType = String(body.transportType || "").trim().toUpperCase();
  const configType = String(body.configType || "").trim().toUpperCase();
  const floor = String(body.floor || "").trim();
  const loadType = String(body.loadType || "").trim();
  const tripType = String(body.tripType || "").trim();
  const minKm = parseInteger(body.minKm);
  const maxKm = parseInteger(body.maxKm);
  const rate = parseDecimalValue(body.rate);

  return {
    transportType,
    configType,
    floor,
    loadType,
    tripType,
    minKm,
    maxKm,
    rate,
  };
};

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

const getSupportedTransportTypes = (configType) =>
  SUPPORTED_TRANSPORT_TYPES_BY_CONFIG[configType] ?? [];

const validatePayload = (payload) => {
  if (!payload.transportType) {
    return "Transport type is required.";
  }
  if (!isTransportType(payload.transportType)) {
    return "Invalid transport type.";
  }
  if (!payload.configType) {
    return "Config type is required.";
  }
  if (!isSupportedConfigType(payload.configType)) {
    return "Invalid config type.";
  }
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

  if (payload.rate === null) {
    return "Rate is required.";
  }
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

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const transportType = String(searchParams.get("transportType") || "")
    .trim()
    .toUpperCase();
  const configType = String(searchParams.get("configType") || "")
    .trim()
    .toUpperCase();

  const where = {};
  if (transportType) {
    if (!isTransportType(transportType)) {
      return NextResponse.json(
        { error: "Invalid transport type filter." },
        { status: 400 },
      );
    }
    where.transportType = transportType;
  }
  if (configType) {
    if (!isSupportedConfigType(configType)) {
      return NextResponse.json(
        { error: "Invalid config type filter." },
        { status: 400 },
      );
    }
    where.configType = configType;
  }

  const configs = await prisma.transportConfig.findMany({
    where,
    orderBy: [{ transportType: "asc" }, { configType: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: configs.map(serializeConfig) });
}

export async function POST(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const body = await req.json();
  const payload = parsePayload(body);
  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const configKey = getConfigKey(payload);

  try {
    const created = await prisma.transportConfig.create({
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

    return NextResponse.json(serializeConfig(created), { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A config for this transport rule already exists." },
        { status: 400 },
      );
    }
    console.error("Failed to create transport config", error);
    return NextResponse.json(
      { error: "Failed to create transport config." },
      { status: 500 },
    );
  }
}
