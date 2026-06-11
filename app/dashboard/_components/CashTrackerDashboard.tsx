import { useCallback, useEffect, useState } from "react";
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
    givenByName: string | null;
    givenToName: string | null;
    companyName: string | null;
    companyCode: string | null;
    projectName: string | null;
    projectCity: string | null;
    remarks: string | null;
};

export default function CashTrackerDashboard() {
    const { isAdmin } = useDashboardContext();
    const [incomeEntries, setIncomeEntries] = useState<IncomeEntryRow[]>([]);
    const [incomeLoading, setIncomeLoading] = useState(false);
    const [expenseEntries, setExpenseEntries] = useState<ExpenseEntryRow[]>([]);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [petiCashEntries, setPetiCashEntries] = useState<PetiCashEntryRow[]>([]);
    const [petiCashLoading, setPetiCashLoading] = useState(false);

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
            console.error("Failed to load peti cash entries", error);
        } finally {
            setPetiCashLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadIncomeEntries();
        loadExpenseEntries();
        loadPetiCashEntries();
    }, [loadIncomeEntries, loadExpenseEntries, loadPetiCashEntries]);

    return (
        <div className="rbac-card flex flex-col theme-surface">
            <h3 className="rbac-title-lg mb-2">Cash Tracker Dashboard</h3>
            <div className="flex flex-col gap-4">
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