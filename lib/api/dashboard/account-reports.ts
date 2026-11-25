import { requestJson } from "../client";

export type AccountReportKind = "expense" | "income";

export type AccountReportRow = {
  id: string;
  date: string;
  amount: number;
  project: { id: string; name: string; city: string | null } | null;
  categoryId: string | null;
  categoryName: string | null;
  companyId: string | null;
  companyName: string | null;
  companyCode: string | null;
  personId: string | null;
  personName: string | null;
  paymentMode: string | null;
  /** Expense only: DIRECT expense entry, or CLAIM made through petty cash. */
  source: "DIRECT" | "CLAIM" | null;
  remark: string | null;
  createdAt: string;
};

export type AccountReportFilters = {
  fromDate?: string;
  toDate?: string;
  projectId?: string;
  companyId?: string;
  categoryId?: string;
  personId?: string;
  paymentMode?: string;
  source?: string;
  q?: string;
};

export type AccountReportResponse = {
  kind: AccountReportKind;
  data: AccountReportRow[];
  total: number;
  totalAmount: number;
  truncated: boolean;
};

export async function loadAccountReport(
  kind: AccountReportKind,
  filters: AccountReportFilters,
) {
  const query: Record<string, string> = { kind };
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query[key] = value;
  });
  return requestJson<AccountReportResponse>({
    path: "/api/account-reports",
    query,
  });
}
