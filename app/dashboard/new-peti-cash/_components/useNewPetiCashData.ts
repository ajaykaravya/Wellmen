"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { incomeApi } from "@/lib/api/dashboard/income";
import { dailyExpenseApi } from "@/lib/api/dashboard/daily-expenses";
import {
  loadCompanyOptions,
  loadExpenseTypeOptions,
  loadIncomeTypeOptions,
  loadProjectOptions,
  loadUserOptions,
  type CompanyOption,
  type ExpenseTypeOption,
  type IncomeTypeOption,
  type ProjectOption,
  type UserOption,
} from "@/lib/api/dashboard/shared-options";
import type { LedgerEntry, LedgerSource } from "./types";

type IncomeRow = {
  id: string;
  amount: number;
  date: string;
  remark: string | null;
  paymentMode: string | null;
  incomeCompanyId: string | null;
  incomeCompanyName: string | null;
  incomeTypeName: string | null;
  receivedByName: string | null;
  projectName: string | null;
};

type ExpenseRow = {
  id: string;
  amount: number;
  date: string;
  remark: string | null;
  paymentMode: string | null;
  expenseCompanyId: string | null;
  expenseCompanyName: string | null;
  expenseTypeName: string | null;
  expenseByName: string | null;
  projectName: string | null;
};

function classifySource(paymentMode: string | null | undefined): LedgerSource {
  return String(paymentMode || "").toUpperCase() === "CASH"
    ? "cashVoucher"
    : "directWhite";
}

function mapIncome(row: IncomeRow): LedgerEntry {
  return {
    id: `income-${row.id}`,
    source: classifySource(row.paymentMode),
    kind: "INCOME",
    amount: Number(row.amount || 0),
    date: row.date,
    companyId: row.incomeCompanyId,
    companyName: row.incomeCompanyName,
    label: row.incomeTypeName || row.receivedByName || "Income",
    remark: row.remark,
    paymentMode: row.paymentMode,
  };
}

function mapExpense(row: ExpenseRow): LedgerEntry {
  return {
    id: `expense-${row.id}`,
    source: classifySource(row.paymentMode),
    kind: "EXPENSE",
    amount: Number(row.amount || 0),
    date: row.date,
    companyId: row.expenseCompanyId,
    companyName: row.expenseCompanyName,
    label: row.expenseTypeName || row.expenseByName || "Expense",
    remark: row.remark,
    paymentMode: row.paymentMode,
  };
}

export function useNewPetiCashData() {
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypeOption[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const loadMaster = useCallback(async () => {
    try {
      setLoading(true);
      const [companyRows, userRows, projectRows, incomeTypeRows, expenseTypeRows] =
        await Promise.all([
          loadCompanyOptions(),
          loadUserOptions(),
          loadProjectOptions(),
          loadIncomeTypeOptions(),
          loadExpenseTypeOptions(),
        ]);
      setCompanies(companyRows);
      setUsers(userRows);
      setProjects(projectRows);
      setIncomeTypes(incomeTypeRows.filter((item) => item.status === "ACTIVE"));
      setExpenseTypes(expenseTypeRows.filter((item) => item.status === "ACTIVE"));
    } catch (error) {
      console.error("Failed to load new peti cash options", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load form options.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      setLedgerLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([
        incomeApi.list({ pageSize: 200 }) as Promise<{ data?: IncomeRow[] }>,
        dailyExpenseApi.list({ pageSize: 200 }) as Promise<{ data?: ExpenseRow[] }>,
      ]);

      const incomeEntries = (incomeRes?.data || []).map(mapIncome);
      const expenseEntries = (expenseRes?.data || []).map(mapExpense);
      const merged = [...incomeEntries, ...expenseEntries].sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return bTime - aTime;
      });
      setLedger(merged);
    } catch (error) {
      console.error("Failed to load ledger", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load ledger.",
      );
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaster();
    loadLedger();
  }, [loadMaster, loadLedger]);

  return {
    loading,
    ledgerLoading,
    companies,
    users,
    projects,
    incomeTypes,
    expenseTypes,
    ledger,
    reloadLedger: loadLedger,
  };
}

export function filterLedger(
  entries: LedgerEntry[],
  opts: {
    sourceFilter: "all" | LedgerSource;
    companyId: string;
  },
) {
  return entries.filter((entry) => {
    if (opts.sourceFilter !== "all" && entry.source !== opts.sourceFilter) {
      return false;
    }
    if (opts.companyId && entry.companyId !== opts.companyId) {
      return false;
    }
    return true;
  });
}

export function summarizeLedger(entries: LedgerEntry[]) {
  const income = entries
    .filter((entry) => entry.kind === "INCOME")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries
    .filter((entry) => entry.kind === "EXPENSE")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return { income, expense, net: income - expense };
}

export function getCashVoucherTotals(entries: LedgerEntry[]) {
  return summarizeLedger(
    entries.filter((entry) => entry.source === "cashVoucher"),
  );
}
