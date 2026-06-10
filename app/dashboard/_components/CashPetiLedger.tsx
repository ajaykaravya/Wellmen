import { useCallback, useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa6";
import { petiCashApi } from "@/lib/api/dashboard/peti-cash";
import { toast } from "react-toastify";
import PetiCashFormContent from "../peti-cash/_components/PetiCashFormContent";

type CashTransaction = {
    id: string;
    transactionType: "DEBIT" | "CREDIT";
    amount: number;
    givenByName: string;
    givenToName: string;
    companyCode: string;
};

type TransactionType = "CREDIT" | "DEBIT";

type PetiCashRow = {
    id: string;
    transactionType: TransactionType;
    givenToName: string | null;
    givenByName: string | null;
    companyCode: string | null;
    amount: number;
};

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
                <p className="text-sm font-semibold">
                    {isDebit
                        ? transaction.givenToName
                        : transaction.givenByName}
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
                    {isDebit ? "-" : "+"}&#8377;
                    {transaction.amount}
                </span>
            </div>
        </div>
    );
}

export default function CashPetiLedger() {
    const [rows, setRows] = useState<PetiCashRow[]>([]);
    const [activeView, setActiveView] = useState<
        "ledger" | "received" | "given"
    >("ledger");

    const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const loadRows = useCallback(async () => {
        try {
            const data = (await petiCashApi.list()) as {
                data: PetiCashRow[];
                total: number;
            };

            setRows(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load peti cash", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load peti cash."
            );
        }
    }, []);

    useEffect(() => {
        loadRows();
    }, [loadRows]);

    const totalCredit = rows
        .filter((item) => item.transactionType === "CREDIT")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalDebit = rows
        .filter((item) => item.transactionType === "DEBIT")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalBalance = totalCredit - totalDebit;

    const formatAmount = (value: number) =>
        `₹${Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    function CashReceivedForm() {
        return (
            <div className="rbac-card">
                <h3 className="rbac-title-lg">
                    Cash Received
                </h3>

                <p className="text-sm text-[color:var(--theme-text-muted)]">
                    Cash received form
                </p>
            </div>
        );
    }


    function CashGivenForm() {
        return (
            <div className="rbac-card">
                <h3 className="rbac-title-lg">
                    Cash Given
                </h3>

                <p className="text-sm text-[color:var(--theme-text-muted)]">
                    Cash given form
                </p>
            </div>
        );
    }

    return (
        <div className="rbac-card flex flex-col theme-surface">
            <h3 className="rbac-title-lg">Cash Peti Ledger</h3>
            <div className="flex flex-col gap-4">
                <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                    {today}
                </p>
                <div className="rbac-card flex flex-col gap-4">
                    <p className="uppercase text-xs">cash silak (Balance)</p>
                    <p className="text-2xl font-bold">{formatAmount(totalBalance)}</p>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rbac-card">
                            <p className="text-xs uppercase">Opening</p>
                            <p className="text-sm">&#8377;Amount</p>
                        </div>

                        <div className="rbac-card">
                            <p className="text-xs uppercase">Cash In</p>
                            <p className="text-sm">{formatAmount(totalCredit)}</p>
                        </div>
                        <div className="rbac-card">
                            <p className="text-xs uppercase">Cash Out</p>
                            <p className="text-sm">{formatAmount(totalDebit)}</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between gap-4">
                    <div
                        onClick={() => setActiveView("received")}
                        className="rbac-card w-full flex flex-col items-center !border-emerald-500/30 !bg-emerald-500/5 cursor-pointer"
                    >
                        <FaArrowUp className="text-emerald-500" />
                        <p className="text-xs capitalize mt-2 font-semibold text-emerald-500">Cash Recived</p>
                    </div>
                    <div
                        onClick={() => setActiveView("given")}
                        className="rbac-card w-full flex flex-col items-center !border-red-500/30 !bg-red-500/5 cursor-pointer"
                    >
                        <FaArrowDown className="text-red-500" />
                        <p className="text-xs capitalize mt-2 font-semibold text-red-500">Cash Spent</p>
                    </div>
                </div>
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
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {activeView === "received" && (
                        <PetiCashFormContent backButton={true} defaultTransactionType={"CREDIT"} />
                    )}

                    {activeView === "given" && (
                        <PetiCashFormContent backButton={true} defaultTransactionType={"DEBIT"} />
                    )}

                </div>
            </div>
        </div>
    );
}