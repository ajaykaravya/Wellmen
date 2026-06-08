import { createCrudApi } from "./resource";
import type { TransportConfigType, TransportType } from "@/lib/transport-management";

export type TransportConfigItem = {
  id: string;
  transportType: TransportType;
  transportTypeLabel: string;
  configType: TransportConfigType;
  configTypeLabel: string;
  configKey: string;
  floor: string | null;
  loadType: string | null;
  minKm: number | null;
  maxKm: number | null;
  tripType: string | null;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TransportConfigPayload = {
  transportType: TransportType;
  configType: TransportConfigType;
  floor: string;
  loadType: string;
  minKm: string | number | null;
  maxKm: string | number | null;
  tripType: string;
  rate: string | number | null;
};

export const transportConfigsApi = createCrudApi<
  TransportConfigItem,
  TransportConfigItem,
  TransportConfigPayload,
  TransportConfigPayload
>("/api/transport-configs");
