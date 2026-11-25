import { requestJson } from "../client";

export type DailyActivityType =
  | "PROJECT_CREATED"
  | "DRAWING_UPLOADED"
  | "DOCUMENT_UPLOADED"
  | "FORM_FILLED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "REPORT_SUBMITTED"
  | "QUERY_RAISED"
  | "CASH_RECEIVED"
  | "CASH_GIVEN"
  | "ADVANCE_GIVEN"
  | "EXPENSE_CLAIMED"
  | "CASH_SPENT"
  | "EXPENSE_PAID";

export type DailyActivityGroup = "money" | "tasks" | "files" | "reports";

export type DailyActivity = {
  id: string;
  type: DailyActivityType;
  group: DailyActivityGroup;
  at: string;
  title: string;
  detail: string | null;
  by: string | null;
  amount: number | null;
  fileUrl: string | null;
  projectId: string | null;
  projectName: string | null;
};

export type DailyActivityTotals = {
  cashReceived: number;
  cashGiven: number;
  expensesPaid: number;
  expensesClaimed: number;
  counts: Partial<Record<DailyActivityType, number>>;
};

export type DailyActivityProject = {
  projectId: string | null;
  projectName: string;
  activities: DailyActivity[];
  totals: DailyActivityTotals;
};

export type DailyActivityResponse = {
  date: string;
  today: string;
  totals: DailyActivityTotals & { activities: number };
  projects: DailyActivityProject[];
};

export async function loadDailyActivity(date?: string) {
  return requestJson<DailyActivityResponse>({
    path: "/api/daily-activity",
    query: date ? { date } : undefined,
  });
}
