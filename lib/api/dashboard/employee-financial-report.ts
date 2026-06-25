import { requestJson } from "../client";

export async function loadEmployeeFinancialReport(query?: {
  fromDate?: string;
  toDate?: string;
  companyId?: string;
  userId?: string;
  employeeId?: string;
}, signal?: AbortSignal) {
  return requestJson<unknown>({
    path: "/api/employee-financial-report",
    query,
    signal,
  });
}
