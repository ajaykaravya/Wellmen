import { useCallback, useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import { petiCashApi } from "@/lib/api/dashboard/peti-cash";
import { toast } from "react-toastify";
import { formatToDDMMYYYY } from "../../../lib/dateUtils";
import PetiCashFormContent from "../peti-cash/_components/PetiCashFormContent";

type CashTransaction = {
    id: string;
    transactionType: "DEBIT" | "CREDIT";
    amount: number;
    givenByName: string;
    givenToName: string;
    companyCode: string;
    date: string;
    expenseTypeName: string | null;
};

type TransactionType = "CREDIT" | "DEBIT";

type PetiCashRow = {
    id: string;
    transactionType: TransactionType;
    givenToName: string | null;
    givenByName: string | null;
    companyCode: string | null;
    companyName: string | null;
    amount: number;
    date: string;
    expenseTypeName: string | null;
};

const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function PetiCashSummary({ transaction }: { transaction: CashTransaction }) {
    const isDebit = transaction.transactionType === "DEBIT";

    return (
        <div
            className={`flex justify-between items-center p-3 rounded-xl border ${isDebit
                ? "border-red-500/30 bg-red-500/5"
                : "border-emerald-500/30 bg-emerald-500/5"
                }`}
        >
            <div>
                <p className="text-xs">{formatToDDMMYYYY(transaction.date)}</p>
                <p className="text-sm font-semibold">
                    {isDebit ? transaction.givenToName : transaction.givenByName}
                </p>
                <p className="text-sm font-semibold">
                    {transaction.expenseTypeName}
                </p>
                <p className="text-xs text-[color:var(--theme-text-muted)]">
                    {transaction.companyCode}
                </p>
            </div>

            <div
                className={`flex items-center gap-1 font-bold ${isDebit ? "text-red-500" : "text-emerald-500"
                    }`}
            >
                <span>
                    {formatCurrency(transaction.amount)}
                </span>
            </div>
        </div>
    );
}

export default function CashPetiLedger() {
    const [rows, setRows] = useState<PetiCashRow[]>([]);
    const [companyWiseBalance, setCompanyWiseBalance] = useState<
        Record<string, { credit: number; debit: number; balance: number }>
    >({});

    const [activeView, setActiveView] = useState<"ledger" | "received" | "given">(
        "ledger",
    );

    const loadRows = useCallback(async () => {
        try {
            const [data, summary] = await Promise.all([
                petiCashApi.list() as Promise<{
                    data: PetiCashRow[];
                    total: number;
                }>,
                petiCashApi.summary({ summary: "companyBalance" }),
            ]);

            setRows(Array.isArray(data?.data) ? data.data : []);
            setCompanyWiseBalance(summary?.balances || {});
        } catch (error) {
            console.error("Failed to load peti cash", error);

            toast.error(
                error instanceof Error ? error.message : "Failed to load peti cash.",
            );
        }
    }, []);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    const handleBack = () => {
        setActiveView("ledger");
    };

    const handleSaved = () => {
        handleBack();
        loadRows();
    };

    return (
        <div className="rbac-card flex flex-col theme-surface">
            <h3 className="rbac-title-lg mb-2">Cash Peti Ledger</h3>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(companyWiseBalance).map(([company, value]) => (
                        <div
                            key={company}
                            className="rbac-card flex flex-col items-center !gap-0"
                        >
                            <p className="text-xs md:font-normal font-semibold uppercase">
                                {company}
                            </p>
                            <p
                                className={`text-xs mt-1 font-semibold ${value.balance < 0
                                    ? "text-red-500"
                                    : value.balance > 0
                                        ? "text-emerald-500"
                                        : "text-gray-500"
                                    }`}
                            >
                                {formatCurrency(value.balance)}
                            </p>
                        </div>
                    ))}
                </div>

                {activeView === "ledger" && (
                    <div className="flex justify-between gap-4">
                        <div
                            onClick={() => setActiveView("received")}
                            className="rbac-card w-full flex flex-col items-center !border-emerald-500/30 !bg-emerald-500/5 cursor-pointer !gap-0"
                        >
                            <FaArrowUp className="text-emerald-500" />
                            <p className="text-xs capitalize mt-2 font-semibold text-emerald-500">
                                Cash Received
                            </p>
                        </div>
                        <div
                            onClick={() => setActiveView("given")}
                            className="rbac-card w-full flex flex-col items-center !border-red-500/30 !bg-red-500/5 cursor-pointer !gap-0"
                        >
                            <FaArrowDown className="text-red-500" />
                            <p className="text-xs capitalize mt-2 font-semibold text-red-500">
                                Cash Spent
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    {activeView === "ledger" && (
                        <>
                            {rows.map((item) => (
                                <PetiCashSummary
                                    key={item.id}
                                    transaction={{
                                        id: item.id,
                                        transactionType: item.transactionType,
                                        amount: item.amount,
                                        givenByName: item.givenByName ?? "",
                                        givenToName: item.givenToName ?? "",
                                        companyCode: item.companyCode ?? "",
                                        date: item.date ?? "",
                                        expenseTypeName: item.expenseTypeName,
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {activeView === "received" && (
                        <PetiCashFormContent
                            backButton={true}
                            defaultTransactionType="CREDIT"
                            onBack={() => handleBack()}
                            onSaved={handleSaved}
                        />
                    )}

                    {activeView === "given" && (
                        <PetiCashFormContent
                            backButton={true}
                            defaultTransactionType="DEBIT"
                            onBack={() => handleBack()}
                            onSaved={handleSaved}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
