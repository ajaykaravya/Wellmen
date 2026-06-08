import { createCrudApi } from "./resource";
import type { TransportType } from "@/lib/transport-management";

export type TransportLogItem = {
  id: string;
  serialNo: number;
  transportType: TransportType;
  transportTypeLabel: string;
  date: string;
  referenceNumber: string | null;
  description: string | null;
  locationType: string | null;
  city: string | null;
  floor: string | null;
  kmStart: number;
  kmEnd: number;
  totalKm: number;
  loadType: string | null;
  driverWages: number;
  otherExpenses: number;
  floorRent: number;
  returnMaterialFreight: number;
  fromLocation: string | null;
  toLocation: string | null;
  mobileNumber: string | null;
  noOfCovers: number;
  totalWeight: number;
  weightCharge: number;
  coverCharge: number;
  vehicleNumber: string | null;
  baseAmount: number;
  gstAmount: number;
  tripType: string | null;
  tripCharge: number;
  vehicleType: string | null;
  loadingCharges: number;
  returnMaterialCharges: number;
  transportCharges: number;
  paymentMode: string | null;
  status: string | null;
  remark: string | null;
  totalAmount: number;
  createdByName: string | null;
};

export const transportManagementApi = createCrudApi<
  TransportLogItem,
  TransportLogItem,
  Record<string, unknown>,
  Record<string, unknown>
>("/api/transport-management");
