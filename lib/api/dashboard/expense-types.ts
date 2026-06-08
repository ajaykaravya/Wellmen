import { createCrudApi } from "./resource";

export type ExpenseTypeItem = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

export const expenseTypesApi = createCrudApi<
  ExpenseTypeItem,
  ExpenseTypeItem,
  { name: string; status: ExpenseTypeItem["status"] }
>("/api/expense-types");
