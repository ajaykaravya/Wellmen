import { createCrudApi } from "./resource";

export type IncomeTypeItem = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

export const incomeTypesApi = createCrudApi<
  IncomeTypeItem,
  IncomeTypeItem,
  { name: string; status: IncomeTypeItem["status"] }
>("/api/income-types");
