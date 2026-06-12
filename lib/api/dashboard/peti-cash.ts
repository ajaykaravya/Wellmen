import { requestJson } from "../client";
import type { QueryParams } from "../query";
import { createCrudApi } from "./resource";

export const petiCashApi = {
  ...createCrudApi("/api/peti-cash"),
  summary(query?: QueryParams) {
    return requestJson<{ balances: Record<string, { credit: number; debit: number; balance: number }> }>({
      path: "/api/peti-cash",
      query,
    });
  },
};

