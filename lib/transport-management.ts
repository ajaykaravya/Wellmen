export type TransportType =
  | "BOLERO_DELIVERY"
  | "BOLERO_RETURN_DC"
  | "COURIER_DAILY"
  | "PORTER_DAILY"
  | "CNG_RICKSHAW"
  | "LOADING_VEHICLE";

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
    key: "COURIER_DAILY",
    label: "Courier Daily Log",
    shortLabel: "Courier",
  },
  {
    key: "PORTER_DAILY",
    label: "Porter Daily Log",
    shortLabel: "Porter",
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

export const getDriverWages = (totalKm: number) => {
  if (!Number.isFinite(totalKm) || totalKm <= 0) return 0;
  if (totalKm <= 100) return 850;
  if (totalKm <= 200) return 1000;
  if (totalKm <= 300) return 1280;
  if (totalKm <= 400) return 1200;
  if (totalKm <= 600) return 1500;
  return 1500;
};

const deliveryFloorRentMap: Record<
  string,
  Record<string, number>
> = {
  "Ground Floor": {
    "Part Load": 400,
    "Half Load": 800,
    "Full Load": 1200,
  },
  "1st Floor": {
    "Part Load": 500,
    "Half Load": 1000,
    "Full Load": 1800,
  },
  "2nd Floor": {
    "Part Load": 600,
    "Half Load": 1200,
    "Full Load": 2150,
  },
  "3rd Floor": {
    "Part Load": 750,
    "Half Load": 1500,
    "Full Load": 2550,
  },
  "4th Floor": {
    "Part Load": 1000,
    "Half Load": 2000,
    "Full Load": 3200,
  },
  "5th Floor": {
    "Part Load": 1250,
    "Half Load": 2500,
    "Full Load": 4000,
  },
  "6th Floor": {
    "Part Load": 1500,
    "Half Load": 3000,
    "Full Load": 4500,
  },
  "Above 6th Floor": {
    "Part Load": 1500,
    "Half Load": 2550,
    "Full Load": 3000,
  },
};

const returnFloorRentMap: Record<string, Record<string, number>> = {
  "Ground Floor": {
    "Part Load": 300,
    "Half Load": 550,
    "Full Load": 800,
  },
  "1st Floor": {
    "Part Load": 450,
    "Half Load": 1050,
    "Full Load": 1200,
  },
  "2nd Floor": {
    "Part Load": 500,
    "Half Load": 1350,
    "Full Load": 1500,
  },
  "3rd Floor": {
    "Part Load": 650,
    "Half Load": 1500,
    "Full Load": 1700,
  },
  "4th Floor": {
    "Part Load": 800,
    "Half Load": 1850,
    "Full Load": 2000,
  },
  "5th Floor": {
    "Part Load": 1000,
    "Half Load": 2050,
    "Full Load": 2500,
  },
  "6th Floor": {
    "Part Load": 1000,
    "Half Load": 2050,
    "Full Load": 2500,
  },
  "Above 6th Floor": {
    "Part Load": 1500,
    "Half Load": 2550,
    "Full Load": 3000,
  },
};

export const getFloorRent = (
  transportType: TransportType,
  floor?: string | null,
  loadType?: string | null,
) => {
  if (!floor || !loadType) return 0;

  const map =
    transportType === "BOLERO_RETURN_DC"
      ? returnFloorRentMap
      : deliveryFloorRentMap;
  return map[floor]?.[loadType] ?? 0;
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

export const getPorterCharges = (baseAmount: number) => {
  const gstAmount = Number(baseAmount || 0) * 0.18;
  return {
    gstAmount,
    totalAmount: Number(baseAmount || 0) + gstAmount,
  };
};

export const getCngTripCharge = (
  totalKm: number,
  tripType?: string | null,
) => {
  const km = Number(totalKm || 0);
  if (!tripType || km <= 50) return 0;
  if (km <= 100) return tripType === "Return" ? 500 : 1000;
  if (km <= 150) return tripType === "Return" ? 1000 : 2000;
  if (km <= 200) return tripType === "Return" ? 1500 : 3000;
  return tripType === "Return" ? 2000 : 4000;
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
