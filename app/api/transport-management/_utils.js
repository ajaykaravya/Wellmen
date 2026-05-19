import { Prisma } from "@prisma/client";
import {
  CNG_STATUS_OPTIONS,
  COURIER_STATUS_OPTIONS,
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  LOADING_STATUS_OPTIONS,
  LOADING_VEHICLE_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  PORTER_STATUS_OPTIONS,
  TRIP_TYPE_OPTIONS,
  TRANSPORT_TYPES,
  getCngTripCharge,
  getCourierCharges,
  getDriverWages,
  getFloorRent,
  getPorterCharges,
  isTransportType,
  parseDecimalValue,
  parseInteger,
  parseTransportDate,
} from "@/lib/transport-management";

const normalizeText = (value) => String(value ?? "").trim();

const normalizeChoice = (value, options) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return (
    options.find(
      (option) =>
        option.toLowerCase() === normalized.toLowerCase(),
    ) ?? null
  );
};

const money = (value) => new Prisma.Decimal(Number(value || 0));
const textOrNull = (value) => {
  const text = normalizeText(value);
  return text || null;
};

const parseRequiredDate = (value, label = "Date") => {
  const parsed = parseTransportDate(value);
  if (!parsed) {
    throw new Error(`${label} is required.`);
  }
  return parsed;
};

const ensureValidTransportType = (value) => {
  const transportType = normalizeText(value).toUpperCase();
  if (!isTransportType(transportType)) {
    throw new Error("Transport type is required.");
  }
  return transportType;
};

const buildBaseRecord = ({ transportType, date, body }) => ({
  transportType,
  date,
  dcNumber: textOrNull(body.dcNumber),
  tripDescription: textOrNull(body.tripDescription),
  locationType: textOrNull(body.locationType),
  city: textOrNull(body.city),
  floor: textOrNull(body.floor),
  kmStart: parseInteger(body.kmStart) ?? 0,
  kmEnd: parseInteger(body.kmEnd) ?? 0,
  totalKm: parseInteger(body.totalKm) ?? 0,
  loadType: textOrNull(body.loadType),
  driverWages: money(0),
  otherExpenses: money(parseDecimalValue(body.otherExpenses) ?? 0),
  floorRent: money(0),
  returnMaterialFreight: money(0),
  courierNumber: textOrNull(body.courierNumber),
  description: textOrNull(body.description),
  fromLocation: textOrNull(body.fromLocation),
  toLocation: textOrNull(body.toLocation),
  mobileNumber: textOrNull(body.mobileNumber),
  noOfCovers: parseInteger(body.noOfCovers) ?? 0,
  totalWeight: money(parseDecimalValue(body.totalWeight) ?? 0),
  weightCharge: money(0),
  coverCharge: money(0),
  materialDescription: textOrNull(body.materialDescription),
  vehicleNumber: textOrNull(body.vehicleNumber),
  baseAmount: money(parseDecimalValue(body.baseAmount) ?? 0),
  gstAmount: money(0),
  tripType: textOrNull(body.tripType),
  tripCharge: money(0),
  vehicleType: textOrNull(body.vehicleType),
  loadingCharges: money(parseDecimalValue(body.loadingCharges) ?? 0),
  returnMaterialCharges: money(parseDecimalValue(body.returnMaterialCharges) ?? 0),
  transportCharges: money(parseDecimalValue(body.transportCharges) ?? 0),
  paymentMode: textOrNull(body.paymentMode),
  status: textOrNull(body.status),
  remark: textOrNull(body.remark),
});

const validateChoice = (value, options, label) => {
  if (!value) return null;
  const normalized = normalizeChoice(value, options);
  if (!normalized) {
    throw new Error(`${label} is invalid.`);
  }
  return normalized;
};

const validateStatusByType = (transportType, status) => {
  if (!status) return null;

  switch (transportType) {
    case "COURIER_DAILY":
      return validateChoice(status, COURIER_STATUS_OPTIONS, "Status");
    case "PORTER_DAILY":
      return validateChoice(status, PORTER_STATUS_OPTIONS, "Status");
    case "CNG_RICKSHAW":
      return validateChoice(status, CNG_STATUS_OPTIONS, "Status");
    case "LOADING_VEHICLE":
      return validateChoice(status, LOADING_STATUS_OPTIONS, "Status");
    default:
      return textOrNull(status);
  }
};

const validateTripType = (transportType, tripType) => {
  if (transportType !== "CNG_RICKSHAW") return null;
  return validateChoice(tripType, TRIP_TYPE_OPTIONS, "Trip type");
};

const validateVehicleType = (transportType, vehicleType) => {
  if (transportType !== "LOADING_VEHICLE") return null;
  return validateChoice(
    vehicleType,
    LOADING_VEHICLE_TYPE_OPTIONS,
    "Vehicle type",
  );
};

const buildBoleroRecord = (transportType, body, record, rentField) => {
  const kmStart = parseInteger(body.kmStart);
  const kmEnd = parseInteger(body.kmEnd);

  if (kmStart === null || kmEnd === null) {
    throw new Error("KM start and KM end are required.");
  }
  if (kmEnd < kmStart) {
    throw new Error("KM end cannot be less than KM start.");
  }

  const totalKm = kmEnd - kmStart;
  const driverWages = getDriverWages(totalKm);
  const rentAmount = getFloorRent(transportType, record.floor, record.loadType);

  return {
    ...record,
    kmStart,
    kmEnd,
    totalKm,
    driverWages: money(driverWages),
    [rentField]: money(rentAmount),
  };
};

const buildCourierRecord = (record, body) => {
  const noOfCovers = parseInteger(body.noOfCovers);
  const totalWeight = parseDecimalValue(body.totalWeight);
  if (noOfCovers === null || totalWeight === null) {
    throw new Error("No. of covers and total weight are required.");
  }

  const charges = getCourierCharges(totalWeight, noOfCovers);
  return {
    ...record,
    noOfCovers,
    totalWeight: money(totalWeight),
    weightCharge: money(charges.weightCharge),
    coverCharge: money(charges.coverCharge),
  };
};

const buildPorterRecord = (record, body) => {
  const baseAmount = parseDecimalValue(body.baseAmount);
  if (baseAmount === null) {
    throw new Error("Base amount is required.");
  }
  const charges = getPorterCharges(baseAmount);
  return {
    ...record,
    baseAmount: money(baseAmount),
    gstAmount: money(charges.gstAmount),
  };
};

const buildCngRecord = (record, body) => {
  const totalKm = parseInteger(body.totalKm);
  const tripType = validateTripType(record.transportType, record.tripType);
  if (totalKm === null) {
    throw new Error("Total KM is required.");
  }
  if (!tripType) {
    throw new Error("Trip type is required.");
  }

  const tripCharge = getCngTripCharge(totalKm, tripType);
  return {
    ...record,
    tripType,
    totalKm,
    tripCharge: money(tripCharge),
  };
};

const buildLoadingRecord = (record, body) => {
  const vehicleType = validateVehicleType(record.transportType, record.vehicleType);
  const loadingCharges = parseDecimalValue(body.loadingCharges);
  const returnMaterialCharges = parseDecimalValue(body.returnMaterialCharges);
  const transportCharges = parseDecimalValue(body.transportCharges);
  const otherExpenses = parseDecimalValue(body.otherExpenses);

  if (!vehicleType) {
    throw new Error("Vehicle type is required.");
  }

  return {
    ...record,
    vehicleType,
    loadingCharges: money(loadingCharges ?? 0),
    returnMaterialCharges: money(returnMaterialCharges ?? 0),
    transportCharges: money(transportCharges ?? 0),
    otherExpenses: money(otherExpenses ?? 0),
  };
};

export const buildTransportRecord = (body) => {
  const transportType = ensureValidTransportType(body.transportType);
  const date = parseRequiredDate(body.date);
  let record = buildBaseRecord({ transportType, date, body });
  record.status = validateStatusByType(transportType, record.status);
  record.paymentMode = validateChoice(
    record.paymentMode,
    PAYMENT_MODE_OPTIONS,
    "Payment mode",
  );
  record.locationType = validateChoice(
    record.locationType,
    LOCATION_TYPE_OPTIONS,
    "Location type",
  );
  record.floor = validateChoice(record.floor, FLOOR_OPTIONS, "Floor");
  record.loadType = validateChoice(record.loadType, LOAD_TYPE_OPTIONS, "Load type");

  switch (transportType) {
    case "BOLERO_DELIVERY": {
      if (!record.tripDescription) {
        throw new Error("Trip description is required.");
      }
      if (!record.locationType) {
        throw new Error("Location type is required.");
      }
      if (!record.city) {
        throw new Error("City is required.");
      }
      record = buildBoleroRecord(transportType, body, record, "floorRent");
      break;
    }
    case "BOLERO_RETURN_DC": {
      if (!record.tripDescription) {
        throw new Error("Trip description is required.");
      }
      if (!record.locationType) {
        throw new Error("Location type is required.");
      }
      if (!record.city) {
        throw new Error("City is required.");
      }
      record = buildBoleroRecord(
        transportType,
        body,
        record,
        "returnMaterialFreight",
      );
      break;
    }
    case "COURIER_DAILY": {
      if (!record.courierNumber) {
        throw new Error("Courier number is required.");
      }
      if (!record.description) {
        throw new Error("Description is required.");
      }
      if (!record.fromLocation || !record.toLocation) {
        throw new Error("From and to locations are required.");
      }
      if (!record.city) {
        throw new Error("City is required.");
      }
      record = buildCourierRecord(record, body);
      break;
    }
    case "PORTER_DAILY": {
      if (!record.materialDescription) {
        throw new Error("Material description is required.");
      }
      if (!record.fromLocation || !record.toLocation) {
        throw new Error("From and to locations are required.");
      }
      if (!record.city) {
        throw new Error("City is required.");
      }
      record = buildPorterRecord(record, body);
      break;
    }
    case "CNG_RICKSHAW": {
      if (!record.dcNumber) {
        throw new Error("DC number is required.");
      }
      if (!record.tripType) {
        throw new Error("Trip type is required.");
      }
      if (!record.fromLocation || !record.toLocation) {
        throw new Error("From and to locations are required.");
      }
      if (!record.city) {
        throw new Error("City/route is required.");
      }
      record = buildCngRecord(record, body);
      break;
    }
    case "LOADING_VEHICLE": {
      if (!record.vehicleType) {
        throw new Error("Vehicle type is required.");
      }
      if (!record.fromLocation || !record.toLocation) {
        throw new Error("From and to locations are required.");
      }
      if (!record.city) {
        throw new Error("City/route is required.");
      }
      if (!record.materialDescription) {
        throw new Error("Material description is required.");
      }
      record = buildLoadingRecord(record, body);
      break;
    }
    default:
      break;
  }

  return record;
};

export const serializeTransportLog = (row) => {
  const totalAmount = (() => {
    switch (row.transportType) {
      case "BOLERO_DELIVERY":
        return Number(row.driverWages || 0) + Number(row.otherExpenses || 0) + Number(row.floorRent || 0);
      case "BOLERO_RETURN_DC":
        return Number(row.driverWages || 0) + Number(row.otherExpenses || 0) + Number(row.returnMaterialFreight || 0);
      case "COURIER_DAILY":
        return Number(row.weightCharge || 0) + Number(row.coverCharge || 0) + Number(row.otherExpenses || 0);
      case "PORTER_DAILY":
        return Number(row.baseAmount || 0) + Number(row.gstAmount || 0);
      case "CNG_RICKSHAW":
        return Number(row.tripCharge || 0) + Number(row.otherExpenses || 0);
      case "LOADING_VEHICLE":
        return Number(row.loadingCharges || 0) + Number(row.returnMaterialCharges || 0) + Number(row.transportCharges || 0) + Number(row.otherExpenses || 0);
      default:
        return 0;
    }
  })();

  return {
    id: row.id,
    serialNo: row.serialNo,
    transportType: row.transportType,
    transportTypeLabel:
      TRANSPORT_TYPES.find((item) => item.key === row.transportType)?.label ||
      row.transportType,
    date: row.date,
    dcNumber: row.dcNumber || null,
    tripDescription: row.tripDescription || null,
    locationType: row.locationType || null,
    city: row.city || null,
    floor: row.floor || null,
    kmStart: row.kmStart,
    kmEnd: row.kmEnd,
    totalKm: row.totalKm,
    loadType: row.loadType || null,
    driverWages: Number(row.driverWages || 0),
    otherExpenses: Number(row.otherExpenses || 0),
    floorRent: Number(row.floorRent || 0),
    returnMaterialFreight: Number(row.returnMaterialFreight || 0),
    courierNumber: row.courierNumber || null,
    description: row.description || null,
    fromLocation: row.fromLocation || null,
    toLocation: row.toLocation || null,
    mobileNumber: row.mobileNumber || null,
    noOfCovers: row.noOfCovers,
    totalWeight: Number(row.totalWeight || 0),
    weightCharge: Number(row.weightCharge || 0),
    coverCharge: Number(row.coverCharge || 0),
    materialDescription: row.materialDescription || null,
    vehicleNumber: row.vehicleNumber || null,
    baseAmount: Number(row.baseAmount || 0),
    gstAmount: Number(row.gstAmount || 0),
    tripType: row.tripType || null,
    tripCharge: Number(row.tripCharge || 0),
    vehicleType: row.vehicleType || null,
    loadingCharges: Number(row.loadingCharges || 0),
    returnMaterialCharges: Number(row.returnMaterialCharges || 0),
    transportCharges: Number(row.transportCharges || 0),
    paymentMode: row.paymentMode || null,
    status: row.status || null,
    remark: row.remark || null,
    totalAmount,
    createdById: row.createdById || null,
    createdByName: row.createdBy
      ? `${row.createdBy.firstName} ${row.createdBy.lastName}`.trim()
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const transportSearchFields = [
  "dcNumber",
  "tripDescription",
  "locationType",
  "city",
  "floor",
  "loadType",
  "courierNumber",
  "description",
  "fromLocation",
  "toLocation",
  "mobileNumber",
  "materialDescription",
  "vehicleNumber",
  "tripType",
  "vehicleType",
  "paymentMode",
  "status",
  "remark",
];
