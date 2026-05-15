export const LOCATION_TYPE_OPTIONS = ["Hospital", "Industry", "Vendor"] as const;

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

export type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number];
export type FloorType = (typeof FLOOR_OPTIONS)[number];
export type LoadType = (typeof LOAD_TYPE_OPTIONS)[number];

const DRIVER_WAGE_RULES = [
  { maxKm: 100, amount: 850 },
  { maxKm: 200, amount: 1000 },
  { maxKm: 300, amount: 1280 },
  { maxKm: 400, amount: 1200 },
  { maxKm: 600, amount: 1500 },
] as const;

const FLOOR_RENT_RULES: Record<
  FloorType,
  Record<LoadType, number>
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

export function isLocationType(value: string): value is LocationType {
  return (LOCATION_TYPE_OPTIONS as readonly string[]).includes(value);
}

export function isFloorType(value: string): value is FloorType {
  return (FLOOR_OPTIONS as readonly string[]).includes(value);
}

export function isLoadType(value: string): value is LoadType {
  return (LOAD_TYPE_OPTIONS as readonly string[]).includes(value);
}

export function calculateTotalKm(kmStart: number, kmEnd: number) {
  if (!Number.isFinite(kmStart) || !Number.isFinite(kmEnd)) return 0;
  return Number((kmEnd - kmStart).toFixed(2));
}

export function calculateDriverWages(totalKm: number) {
  if (!Number.isFinite(totalKm) || totalKm <= 0) return 0;

  for (const rule of DRIVER_WAGE_RULES) {
    if (totalKm <= rule.maxKm) return rule.amount;
  }

  return DRIVER_WAGE_RULES[DRIVER_WAGE_RULES.length - 1].amount;
}

export function calculateFloorRent(floor: string, loadType: string) {
  if (!isFloorType(floor) || !isLoadType(loadType)) return 0;
  return FLOOR_RENT_RULES[floor][loadType];
}

export function calculateTotalAmount(params: {
  driverWages: number;
  otherExpenses: number;
  floorRent: number;
}) {
  const driverWages = Number.isFinite(params.driverWages)
    ? params.driverWages
    : 0;
  const otherExpenses = Number.isFinite(params.otherExpenses)
    ? params.otherExpenses
    : 0;
  const floorRent = Number.isFinite(params.floorRent) ? params.floorRent : 0;
  return Number((driverWages + otherExpenses + floorRent).toFixed(2));
}
