import { requestJson } from "../client";

export type LedgerEntry = {
  id: string;
  date: string;
  amount: number;
  categoryName: string | null;
  companyName: string | null;
  personName: string | null;
  paymentMode: string | null;
  remark: string | null;
  fromPetiCash?: boolean;
};

export type ProjectLedger = {
  project: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    contactNumber: string | null;
    email: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
    description: string | null;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    incomeCount: number;
    expenseCount: number;
  };
  byDate: { date: string; income: number; expense: number; net: number }[];
  income: LedgerEntry[];
  expenses: LedgerEntry[];
};

export async function loadProjectLedger(
  projectId: string,
  range?: { from?: string; to?: string },
) {
  const query: Record<string, string> = {};
  if (range?.from) query.from = range.from;
  if (range?.to) query.to = range.to;

  const data = await requestJson<{ data: ProjectLedger }>({
    path: `/api/projects/${projectId}/ledger`,
    query,
  });
  return data?.data || null;
}
