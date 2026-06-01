export type TransportType =
  | "BOLERO_DELIVERY"
  | "BOLERO_RETURN_DC"
  | "COURIER_DAILY"
  | "PORTER_DAILY"
  | "CNG_RICKSHAW"
  | "LOADING_VEHICLE";

export type TransportConfigType =
  | "DRIVER_WAGE_SLAB"
  | "FLOOR_RENT"
  | "COURIER_WEIGHT_RATE"
  | "COURIER_COVER_RATE"
  | "CNG_TRIP_SLAB";

export type FloorRentConfig = {
  id?: string;
  transportType: TransportType;
  configType: TransportConfigType;
  configKey: string;
  floor?: string | null;
  loadType?: string | null;
  minKm?: number | null;
  maxKm?: number | null;
  tripType?: string | null;
  rateType?: string | null;
  configData?: {
    floor?: string | null;
    loadType?: string | null;
    minKm?: number | null;
    maxKm?: number | null;
    tripType?: string | null;
    rateType?: string | null;
  } | null;
  rate: number;
  isActive?: boolean;
};

export type DeliveryFloorRentConfig = FloorRentConfig;
export type DriverWageConfig = FloorRentConfig;
export type CourierRateConfig = FloorRentConfig;
export type CngTripConfig = FloorRentConfig;

export const TRANSPORT_CONFIG_TYPE_LABELS: Record<string, string> = {
  DRIVER_WAGE_SLAB: "Driver Wage Slab",
  FLOOR_RENT: "Floor Rent",
  COURIER_WEIGHT_RATE: "Courier Weight Rate",
  COURIER_COVER_RATE: "Courier Cover Rate",
  CNG_TRIP_SLAB: "CNG Trip Slab",
};

export const getTransportConfigTypeLabel = (value?: string | null) =>
  TRANSPORT_CONFIG_TYPE_LABELS[String(value || "").trim()] ?? value ?? "-";

export const TRANSPORT_CONFIG_TYPES: Array<{
  key: TransportConfigType;
  label: string;
}> = [
    { key: "DRIVER_WAGE_SLAB", label: "Driver Wage Slab" },
    { key: "FLOOR_RENT", label: "Floor Rent" },
    { key: "COURIER_WEIGHT_RATE", label: "Courier Weight Rate" },
    { key: "COURIER_COVER_RATE", label: "Courier Cover Rate" },
    { key: "CNG_TRIP_SLAB", label: "CNG Trip Slab" },
  ];

export const TRANSPORT_TYPES: Array<{
  key: TransportType;
  label: string;
  shortLabel: string;
}> = [
    {
      key: "BOLERO_DELIVERY",
      label: "Bolero - Delivery Log",
      shortLabel: "Bolero Delivery",
    },
    {
      key: "BOLERO_RETURN_DC",
      label: "Bolero - Return DC Log",
      shortLabel: "Bolero Return",
    },
    {
      key: "CNG_RICKSHAW",
      label: "CNG Rickshaw Log",
      shortLabel: "CNG Rickshaw",
    },
    {
      key: "LOADING_VEHICLE",
      label: "Loading Vehicle Log",
      shortLabel: "Loading Vehicle",
    },
    {
      key: "COURIER_DAILY",
      label: "Courier Daily Log",
      shortLabel: "Courier",
    },
    {
      key: "PORTER_DAILY",
      label: "Porter Daily Log",
      shortLabel: "Porter",
    },
  ];

export const FLOOR_OPTIONS = [
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "5th Floor",
  "6th Floor",
  "Above 6th Floor",
] as const;

export const LOAD_TYPE_OPTIONS = ["Part Load", "Half Load", "Full Load"] as const;
export const LOCATION_TYPE_OPTIONS = ["Hospital", "Industry", "Vendor"] as const;
export const COURIER_STATUS_OPTIONS = ["Pending", "Delivered", "In Transit"] as const;
export const PORTER_STATUS_OPTIONS = ["Paid", "Pending"] as const;
export const CNG_STATUS_OPTIONS = ["Completed", "Pending"] as const;
export const LOADING_STATUS_OPTIONS = ["Completed", "Pending"] as const;
export const PAYMENT_MODE_OPTIONS = [
  "Cash",
  "GPay",
  "PhonePe",
  "Card",
  "UPI",
] as const;
export const TRIP_TYPE_OPTIONS = ["Delivery", "Return"] as const;
export const LOADING_VEHICLE_TYPE_OPTIONS = [
  "Three Tyre Tempo",
  "Super Carry",
  "Other Heavy Vehicle",
] as const;

type MaybeNumber = number | null | undefined;

const formatAmount = (value: MaybeNumber) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const getTransportTypeLabel = (value?: string | null) =>
  TRANSPORT_TYPES.find((item) => item.key === value)?.label ?? value ?? "-";

export const getTransportTypeShortLabel = (value?: string | null) =>
  TRANSPORT_TYPES.find((item) => item.key === value)?.shortLabel ?? value ?? "-";

export const getTransportReferenceLabel = (transportType: TransportType) =>
  transportType === "COURIER_DAILY" ? "Courier Number" : "DC Number";

export const buildFloorRentConfigKey = (
  floor?: string | null,
  loadType?: string | null,
) =>
  [String(floor || "").trim().toLowerCase(), String(loadType || "").trim().toLowerCase()]
    .map((value) => value || "-")
    .join("::");

export const buildDeliveryFloorRentConfigKey = buildFloorRentConfigKey;

export const buildDriverWageConfigKey = (
  minKm?: number | null,
  maxKm?: number | null,
) =>
  [
    String(minKm ?? "").trim(),
    String(maxKm ?? "").trim(),
  ].map((value) => value || "-").join("::");

export const buildCourierRateConfigKey = (rateType?: string | null) =>
  String(rateType || "").trim().toLowerCase() || "-";

export const buildCngTripConfigKey = (
  tripType?: string | null,
  minKm?: number | null,
  maxKm?: number | null,
) =>
  [
    String(tripType || "").trim().toLowerCase(),
    String(minKm ?? "").trim(),
    String(maxKm ?? "").trim(),
  ]
    .map((value) => value || "-")
    .join("::");

export const findFloorRentConfig = (
  configs: FloorRentConfig[] | undefined,
  transportType: TransportType,
  floor?: string | null,
  loadType?: string | null,
) => {
  if (!configs?.length || !floor || !loadType) return null;

  const configKey = buildFloorRentConfigKey(floor, loadType);
  return (
    configs.find(
      (item) =>
        item.transportType === transportType &&
        item.configKey === configKey &&
        item.isActive !== false,
    ) ?? null
  );
};

export const findDeliveryFloorRentConfig = (
  configs: FloorRentConfig[] | undefined,
  floor?: string | null,
  loadType?: string | null,
) => findFloorRentConfig(configs, "BOLERO_DELIVERY", floor, loadType);

export const findDriverWageConfig = (
  configs: DriverWageConfig[] | undefined,
  transportType: TransportType,
  totalKm?: number | null,
) => {
  const km = Number(totalKm || 0);
  if (!configs?.length || !Number.isFinite(km) || km <= 0) {
    return null;
  }

  return (
    configs.find(
      (item) =>
        item.transportType === transportType &&
        item.configType === "DRIVER_WAGE_SLAB" &&
        item.isActive !== false &&
        Number(item.configData?.minKm ?? item.minKm ?? 0) <= km &&
        km <= Number(item.configData?.maxKm ?? item.maxKm ?? 0),
    ) ?? null
  );
};

export const getDriverWages = (
  totalKm: number,
  configs?: DriverWageConfig[],
  transportType: TransportType = "BOLERO_DELIVERY",
) => {
  if (!Number.isFinite(totalKm) || totalKm <= 0) return 0;

  if (configs?.length) {
    const config = findDriverWageConfig(configs, transportType, totalKm);
    return Number(config?.rate || 0);
  }

  return 0;
};

export const getFloorRent = (
  transportType: TransportType,
  floor?: string | null,
  loadType?: string | null,
  configs?: DeliveryFloorRentConfig[],
) => {
  if (!floor || !loadType) return 0;

  if (transportType === "BOLERO_DELIVERY" || transportType === "BOLERO_RETURN_DC") {
    const config = findFloorRentConfig(configs, transportType, floor, loadType);
    return Number(config?.rate || 0);
  }
  return 0;
};

export const getCourierCharges = (totalWeight: number, noOfCovers: number) => {
  const weightCharge = Number(totalWeight || 0) * 30;
  const coverCharge = Number(noOfCovers || 0) * 15;
  return {
    weightCharge,
    coverCharge,
    totalAmount: weightCharge + coverCharge,
  };
};

export const getCourierChargesWithConfigs = (
  totalWeight: number,
  noOfCovers: number,
  configs?: CourierRateConfig[],
) => {
  if (configs?.length) {
    const weightRate = configs.find(
      (item) =>
        item.configType === "COURIER_WEIGHT_RATE" &&
        item.isActive !== false,
    );
    const coverRate = configs.find(
      (item) =>
        item.configType === "COURIER_COVER_RATE" &&
        item.isActive !== false,
    );
    const weightCharge = Number(totalWeight || 0) * Number(weightRate?.rate || 0);
    const coverCharge = Number(noOfCovers || 0) * Number(coverRate?.rate || 0);
    return {
      weightCharge,
      coverCharge,
      totalAmount: weightCharge + coverCharge,
    };
  }

  return getCourierCharges(totalWeight, noOfCovers);
};

export const findCourierRateConfig = (
  configs: CourierRateConfig[] | undefined,
  transportType: TransportType,
  configType: "COURIER_WEIGHT_RATE" | "COURIER_COVER_RATE",
) =>
  configs?.find(
    (item) =>
      item.transportType === transportType &&
      item.configType === configType &&
      item.isActive !== false,
  ) ?? null;

export const findCngTripConfig = (
  configs: CngTripConfig[] | undefined,
  tripType?: string | null,
  totalKm?: number | null,
) => {
  const km = Number(totalKm || 0);
  if (!configs?.length || !tripType || !Number.isFinite(km) || km <= 0) {
    return null;
  }

  return (
    configs.find(
      (item) =>
        item.configType === "CNG_TRIP_SLAB" &&
        item.tripType === tripType &&
        item.isActive !== false &&
        km >= Number(item.configData?.minKm ?? item.minKm ?? 0) &&
        km <= Number(item.configData?.maxKm ?? item.maxKm ?? 0),
    ) ?? null
  );
};

export const getPorterCharges = (baseAmount: number, otherExpenses: number) => {
  const gstAmount = Number(baseAmount || 0) * 0.18;
  return {
    gstAmount,
    totalAmount: Number(baseAmount || 0) + gstAmount + Number(otherExpenses || 0),
  };
};

export const getCngTripCharge = (
  totalKm: number,
  tripType?: string | null,
  configs?: CngTripConfig[],
) => {
  const km = Number(totalKm || 0);

  if (!tripType || km <= 0) return 0;

  if (configs?.length) {
    const config = configs.find(
      (item) =>
        item.configType === "CNG_TRIP_SLAB" &&
        item.tripType === tripType &&
        item.isActive !== false &&
        km >= Number(item.configData?.minKm ?? item.minKm ?? 0) &&
        km <= Number(item.configData?.maxKm ?? item.maxKm ?? 0),
    );
    return Number(config?.rate || 0);
  }

  const isReturn = tripType === "Return";

  if (km <= 50) {
    return 0;
  }

  if (km <= 100) {
    return isReturn ? 500 : 1000;
  }

  if (km <= 150) {
    return isReturn ? 1000 : 2000;
  }

  if (km <= 200) {
    return isReturn ? 1500 : 3000;
  }

  return isReturn ? 2000 : 4000;
};

export const getLoadingVehicleTotal = (
  loadingCharges: number,
  returnMaterialCharges: number,
  transportCharges: number,
  otherExpenses: number,
) =>
  Number(loadingCharges || 0) +
  Number(returnMaterialCharges || 0) +
  Number(transportCharges || 0) +
  Number(otherExpenses || 0);

export const formatTransportMoney = formatAmount;

export const parseInteger = (value: unknown) => {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

export const parseDecimalValue = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseTransportDate = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const ddmmyyyyMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
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

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isTransportType = (value: string): value is TransportType =>
  TRANSPORT_TYPES.some((item) => item.key === value);
