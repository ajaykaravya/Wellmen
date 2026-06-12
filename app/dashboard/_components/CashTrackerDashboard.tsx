import { useCallback, useEffect, useMemo, useState } from "react";
import { FinanceCardList } from "./FinanceCardList";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import { useDashboardContext } from "./DashboardShell";
import { incomeApi } from "@/lib/api/dashboard/income";
import { dailyExpenseApi } from "@/lib/api/dashboard/daily-expenses";
import { petiCashApi } from "@/lib/api/dashboard/peti-cash";

type CrudListResponse<T> = {
    data: T[];
    total: number;
    totalPages?: number;
};

type IncomeEntryRow = {
    id: string;
    transactionType: "INCOME";
    createdAt: string;
    date: string;
    amount: number;
    projectName: string | null;
    projectCity: string | null;
    incomeTypeName: string | null;
    incomeCompanyName: string | null;
    incomeCompanyCode: string | null;
    receivedByName: string | null;
    paymentMode: string | null;
    remark: string | null;
};

type ExpenseEntryRow = {
    id: string;
    createdAt: string;
    date: string;
    amount: number;
    projectName: string | null;
    projectCity: string | null;
    expenseTypeName: string | null;
    expenseByName: string | null;
    expenseCompanyName: string | null;
    expenseCompanyCode: string | null;
    paymentMode: string | null;
    remark: string | null;
};

type PetiCashEntryRow = {
    id: string;
    transactionType: "CREDIT" | "DEBIT";
    createdAt: string;
    date: string;
    amount: number;
    givenById: string | null;
    givenByName: string | null;
    givenByRole: string | null;
    givenToId: string | null;
    givenToName: string | null;
    givenToRole: string | null;
    companyId: string | null;
    companyName: string | null;
    companyCode: string | null;
    projectName: string | null;
    projectCity: string | null;
    remarks: string | null;
};

type ManagerCompanySummary = {
    companyName: string;
    companyCode: string | null;
    total: number;
};

type ManagerSummary = {
    managerName: string;
    total: number;
    companies: ManagerCompanySummary[];
};

const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function CashTrackerDashboard() {
    const { isAdmin } = useDashboardContext();
    const [incomeEntries, setIncomeEntries] = useState<IncomeEntryRow[]>([]);
    const [incomeLoading, setIncomeLoading] = useState(false);
    const [expenseEntries, setExpenseEntries] = useState<ExpenseEntryRow[]>([]);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [petiCashEntries, setPetiCashEntries] = useState<PetiCashEntryRow[]>([]);
    const [petiCashAllEntries, setPetiCashAllEntries] = useState<PetiCashEntryRow[]>([]);
    const [petiCashLoading, setPetiCashLoading] = useState(false);
    const [petiCashSummaryLoading, setPetiCashSummaryLoading] = useState(false);

    const managerSummaries = useMemo<ManagerSummary[]>(() => {
        const summaryMap = new Map<string, { managerName: string; total: number; companies: Map<string, ManagerCompanySummary> }>();

        petiCashAllEntries.forEach((entry) => {
            const isCreditForManager = entry.transactionType === "CREDIT" && entry.givenToRole === "Manager";
            const isDebitFromManager = entry.transactionType === "DEBIT" && entry.givenByRole === "Manager";
            if (!isCreditForManager && !isDebitFromManager) return;

            const managerId = isCreditForManager ? entry.givenToId : entry.givenById;
            const managerName = isCreditForManager ? entry.givenToName?.trim() : entry.givenByName?.trim();
            const managerKey = `${managerId || managerName || "unknown"}:${managerName || "Unknown Manager"}`;
            const displayManagerName = managerName || "Unknown Manager";
            const companyKey = entry.companyId || entry.companyCode || entry.companyName || "unknown-company";
            const companyName = entry.companyName || entry.companyCode || "Unknown Company";
            const amount = isCreditForManager ? entry.amount : -entry.amount;

            const manager = summaryMap.get(managerKey) ?? {
                managerName: displayManagerName,
                total: 0,
                companies: new Map<string, ManagerCompanySummary>(),
            };

            manager.total += amount;

            const company = manager.companies.get(companyKey) ?? {
                companyName,
                companyCode: entry.companyCode,
                total: 0,
            };
            company.total += amount;
            manager.companies.set(companyKey, company);
            summaryMap.set(managerKey, manager);
        });

        return Array.from(summaryMap.values())
            .map((manager) => ({
                managerName: manager.managerName,
                total: manager.total,
                companies: Array.from(manager.companies.values()).sort((a, b) => b.total - a.total),
            }))
            .sort((a, b) => b.total - a.total);
    }, [petiCashEntries]);

    const loadIncomeEntries = useCallback(async () => {
        if (!isAdmin) return;

        setIncomeLoading(true);
        try {
            const data = (await incomeApi.list({
                page: 1,
                pageSize: 10,
            })) as CrudListResponse<IncomeEntryRow>;
            setIncomeEntries(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load income entries", error);
        } finally {
            setIncomeLoading(false);
        }
    }, [isAdmin]);

    const loadExpenseEntries = useCallback(async () => {
        if (!isAdmin) return;

        setExpenseLoading(true);
        try {
            const data = (await dailyExpenseApi.list({
                page: 1,
                pageSize: 10,
            })) as CrudListResponse<ExpenseEntryRow>;
            setExpenseEntries(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load expense entries", error);
        } finally {
            setExpenseLoading(false);
        }
    }, [isAdmin]);

    const loadPetiCashEntries = useCallback(async () => {
        if (!isAdmin) return;

        setPetiCashLoading(true);
        try {
            const data = (await petiCashApi.list({
                page: 1,
                pageSize: 10,
            })) as CrudListResponse<PetiCashEntryRow>;
            setPetiCashEntries(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load latest peti cash entries", error);
        } finally {
            setPetiCashLoading(false);
        }
    }, [isAdmin]);

    const loadPetiCashSummaryEntries = useCallback(async () => {
        if (!isAdmin) return;

        setPetiCashSummaryLoading(true);
        try {
            const data = (await petiCashApi.list()) as CrudListResponse<PetiCashEntryRow>;
            setPetiCashAllEntries(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load all peti cash entries for summary", error);
        } finally {
            setPetiCashSummaryLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadIncomeEntries();
        loadExpenseEntries();
        loadPetiCashEntries();
        loadPetiCashSummaryEntries();
    }, [loadIncomeEntries, loadExpenseEntries, loadPetiCashEntries, loadPetiCashSummaryEntries]);

    return (
        <div className="rbac-card flex flex-col theme-surface">
            <h3 className="rbac-title-lg mb-2">Cash Tracker Dashboard</h3>
            <div className="flex flex-col gap-4">
                <div className="rbac-card p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-sm font-semibold">Manager Cash Summary</h4>
                            <p className="text-xs text-slate-500">Total cash on hand grouped by manager and company.</p>
                        </div>
                    </div>
                    {petiCashSummaryLoading ? (
                        <div className="flex items-center justify-center py-4 text-slate-500">Loading manager summary...</div>
                    ) : managerSummaries.length === 0 ? (
                        <div className="py-4 text-sm text-slate-500">No manager cash records found.</div>
                    ) : (
                        <div className="space-y-4">
                            {managerSummaries.map((manager) => (
                                <div key={manager.managerName} className="rbac-card">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold">{manager.managerName}</div>
                                            <div className="text-xs">Total cash on hand</div>
                                        </div>
                                        <div className={`text-sm font-semibold ${manager.total >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                            {formatCurrency(manager.total)}
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        {manager.companies.map((company) => (
                                            <div key={`${manager.managerName}-${company.companyName}`} className="flex items-center justify-between">
                                                <div className="text-xs uppercase tracking-wide text-slate-500">{company.companyCode}</div>
                                                <div className={`mt-1 text-sm font-semibold ${company.total >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                                    {formatCurrency(company.total)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <FinanceCardList<IncomeEntryRow>
                    title="Incomes"
                    showCount={false}
                    rows={incomeEntries}
                    loading={incomeLoading}
                    emptyLabel="No income entries found."
                    addHref="/dashboard/income"
                    cardContent={{
                        getVariant: () => "income",
                        getCode: (row) => row.incomeCompanyCode,
                        getTitle: (row) => row.incomeTypeName || "",
                        getPaymentMode: (row) => row.paymentMode,
                        getProjectName: (row) => row.projectName,
                        getProjectCity: (row) => row.projectCity,
                        getReceivedByName: (row) => row.receivedByName,
                        getRemark: (row) => row.remark || "",
                        getDateLabel: (row) => formatToDDMMYYYY(row.date),
                    }}
                />
                <FinanceCardList<ExpenseEntryRow>
                    title="Expenses"
                    showCount={false}
                    rows={expenseEntries}
                    loading={expenseLoading}
                    emptyLabel="No expense entries found."
                    addHref="/dashboard/daily-expenses"
                    cardContent={{
                        getVariant: () => "expense",
                        getCode: (row) => row.expenseCompanyCode,
                        getPaymentMode: (row) => row.paymentMode,
                        getProjectName: (row) => row.projectName,
                        getProjectCity: (row) => row.projectCity,
                        getExpenseByName: (row) => row.expenseByName,
                        getTitle: (row) => row.expenseTypeName || "",
                        getRemark: (row) => row.remark || "",
                        getDateLabel: (row) => formatToDDMMYYYY(row.date),
                    }}
                />
                <FinanceCardList<PetiCashEntryRow>
                    title="Peti Cash"
                    showCount={false}
                    rows={petiCashEntries}
                    loading={petiCashLoading}
                    emptyLabel="No peti cash entries found."
                    addHref="/dashboard/peti-cash"
                    cardContent={{
                        getVariant: (row) => (row.transactionType === "CREDIT" ? "income" : "expense"),
                        getCode: (row) => row.companyCode,
                        getTagClassName: (row) =>
                            row.transactionType === "CREDIT"
                                ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                                : "bg-rose-100 text-rose-800 ring-rose-200",
                        getProjectName: (row) => row.projectName,
                        getProjectCity: (row) => row.projectCity,
                        getCashGivenByName: (row) => row.givenByName,
                        getCashGivenToName: (row) => row.givenToName,
                        getRemark: (row) => row.remarks || "",
                        getDateLabel: (row) => formatToDDMMYYYY(row.date),
                    }}
                />
            </div>
        </div>
    )
}