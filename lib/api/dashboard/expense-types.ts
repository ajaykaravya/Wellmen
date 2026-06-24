import { createCrudApi } from "./resource";

export type ExpenseTypeItem = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  userIds?: string[];
  users?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
};

export const expenseTypesApi = createCrudApi<
  ExpenseTypeItem,
  ExpenseTypeItem,
  { name: string; status: ExpenseTypeItem["status"]; userIds: string[] }
>("/api/expense-types");
