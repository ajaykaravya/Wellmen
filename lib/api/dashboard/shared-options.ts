import { normalizeArrayResponse } from "../query";
import { requestJson } from "../client";

export type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
  status?: string;
};

export type CompanyOption = {
  id: string;
  name: string;
  code?: string | null;
};

export type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
  mobileNumber?: string | null;
};

export type IncomeTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

export type ExpenseTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  users?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
};

export type RoleOption = {
  id: string;
  name: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  category?: string;
};

export async function loadProjectOptions() {
  const data = await requestJson<unknown>({ path: "/api/projects/options" });
  return normalizeArrayResponse<ProjectOption>(data);
}

export async function loadCompanyOptions() {
  const data = await requestJson<unknown>({ path: "/api/companies/options" });
  return normalizeArrayResponse<CompanyOption>(data);
}

export async function loadUserOptions() {
  const data = await requestJson<unknown>({ path: "/api/users/options" });
  return normalizeArrayResponse<UserOption>(data);
}

export async function loadIncomeTypeOptions() {
  const data = await requestJson<unknown>({ path: "/api/income-types/options" });
  return normalizeArrayResponse<IncomeTypeOption>(data);
}

export async function loadExpenseTypeOptions() {
  const data = await requestJson<unknown>({ path: "/api/expense-types/options" });
  return normalizeArrayResponse<ExpenseTypeOption>(data);
}

export async function loadRoleOptions() {
  const data = await requestJson<unknown>({ path: "/api/roles" });
  return normalizeArrayResponse<RoleOption>(data);
}

export async function loadCategoryOptions(path: string) {
  const data = await requestJson<unknown>({ path });
  return normalizeArrayResponse<CategoryOption>(data);
}
