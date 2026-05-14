"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type TransactionType = "INCOME" | "EXPENSE";

type ExpenseTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

type DailyExpenseFormState = {
  transactionType: TransactionType;
  amount: string;
  expenseTypeId: string;
  date: string;
  remark: string;
};

type DailyExpenseFormContentProps = {
  dailyExpenseId?: string;
  initialTransactionType?: TransactionType;
};

const TRANSACTION_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

function getDisplayLabel(option: ExpenseTypeOption) {
  return option.name;
}

export default function DailyExpenseFormContent({
  dailyExpenseId,
  initialTransactionType = "INCOME",
}: DailyExpenseFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<DailyExpenseFormState>({
    transactionType: initialTransactionType,
    amount: "",
    expenseTypeId: "",
    date: getTodayInputDate(),
    remark: "",
  });
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [expenseTypeQuery, setExpenseTypeQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DailyExpenseFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadExpenseTypes = async () => {
      try {
        const res = await fetch("/api/expense-types/options");
        if (!res.ok) {
          throw new Error("Failed to load expense types");
        }
        const data = await res.json();
        setExpenseTypes(
          Array.isArray(data)
            ? data.filter((item: ExpenseTypeOption) => item.status === "ACTIVE")
            : [],
        );
      } catch (error) {
        console.error("Failed to load expense types", error);
        toast.error("Failed to load expense types.");
      }
    };

    loadExpenseTypes();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!dailyExpenseId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/daily-expenses/${dailyExpenseId}`);
        if (!res.ok) {
          setNote("Failed to load daily expense.");
          return;
        }

        const data = await res.json();
        setForm({
          transactionType: data.transactionType === "EXPENSE" ? "EXPENSE" : "INCOME",
          amount: String(data.amount ?? ""),
          expenseTypeId: data.expenseTypeId || "",
          date: formatToDDMMYYYY(data.date) === "-" ? getTodayInputDate() : formatToDDMMYYYY(data.date),
          remark: data.remark || "",
        });
        setExpenseTypeQuery(data.expenseTypeName || "");
      } catch (error) {
        console.error("Failed to load daily expense", error);
        setNote("Failed to load daily expense.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dailyExpenseId]);

  const filteredExpenseTypes = useMemo(() => {
    const query = expenseTypeQuery.trim().toLowerCase();
    if (!query) return expenseTypes;
    return expenseTypes.filter((option) =>
      getDisplayLabel(option).toLowerCase().includes(query),
    );
  }, [expenseTypes, expenseTypeQuery]);

  const selectedExpenseType = useMemo(
    () => expenseTypes.find((option) => option.id === form.expenseTypeId) || null,
    [expenseTypes, form.expenseTypeId],
  );

  useEffect(() => {
    if (form.transactionType === "INCOME") {
      setExpenseTypeQuery("");
    }
  }, [form.transactionType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof DailyExpenseFormState, string>> = {};
    if (!form.transactionType) newErrors.transactionType = "Transaction type is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (form.transactionType === "EXPENSE" && !form.expenseTypeId) {
      newErrors.expenseTypeId = "Expense type is required.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        dailyExpenseId ? `/api/daily-expenses/${dailyExpenseId}` : "/api/daily-expenses",
        {
          method: dailyExpenseId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: form.transactionType,
            amount: form.amount,
            expenseTypeId:
              form.transactionType === "EXPENSE" ? form.expenseTypeId : "",
            date: form.date,
            remark: form.remark,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save daily expense.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        `Daily expense ${dailyExpenseId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/daily-expenses");
    } catch (error) {
      console.error("Failed to save daily expense", error);
      setNote("Failed to save daily expense.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="rbac-title-lg">
            {dailyExpenseId ? "Edit Daily Expense" : "Add New Daily Expense"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "opacity-70 pointer-events-none" : ""}
          >
            <label className="rbac-label">
              Transaction Type <span className="text-red-600">*</span>
            </label>
            <div className="mb-4 flex flex-wrap gap-4">
              {TRANSACTION_OPTIONS.map((option) => (
                <label key={option.value} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="transactionType"
                    value={option.value}
                    checked={form.transactionType === option.value}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        transactionType: option.value,
                        expenseTypeId:
                          option.value === "EXPENSE" ? prev.expenseTypeId : "",
                      }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.transactionType && (
              <p className="text-sm text-red-600 mb-2">{errors.transactionType}</p>
            )}

            <label className="rbac-label">
              Amount <span className="text-red-600">*</span>
              <input
                className="rbac-input mb-2"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={form.amount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </label>
            {errors.amount && (
              <p className="text-sm text-red-600 mb-2">{errors.amount}</p>
            )}

            {form.transactionType === "EXPENSE" && (
              <div className="mb-2">
                <label className="rbac-label">
                  Expense Type <span className="text-red-600">*</span>
                </label>
                <Combobox
                  value={selectedExpenseType}
                  onChange={(expenseType: ExpenseTypeOption | null) => {
                    setForm((prev) => ({
                      ...prev,
                      expenseTypeId: expenseType?.id || "",
                    }));
                    setExpenseTypeQuery("");
                  }}
                  nullable
                >
                  <div className="relative">
                    <ComboboxInput
                      className="theme-input rbac-input mb-2 w-full pr-10"
                      placeholder="Search expense type"
                      displayValue={(expenseType: ExpenseTypeOption | null) =>
                        expenseType ? getDisplayLabel(expenseType) : expenseTypeQuery
                      }
                      onChange={(event) => {
                        setExpenseTypeQuery(event.target.value);
                        setForm((prev) => ({ ...prev, expenseTypeId: "" }));
                      }}
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                      <ChevronDownIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </ComboboxButton>
                    <ComboboxOptions
                      modal={false}
                      className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]"
                    >
                      {filteredExpenseTypes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-[color:var(--theme-text-muted)]">
                          No expense types found
                        </div>
                      ) : (
                        filteredExpenseTypes.map((option) => (
                          <ComboboxOption
                            key={option.id}
                            value={option}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span>{option.name}</span>
                            </div>
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </div>
                </Combobox>
                {selectedExpenseType && !expenseTypeQuery && (
                  <p className="text-xs text-[color:var(--theme-text-muted)]">
                    Selected: {getDisplayLabel(selectedExpenseType)}
                  </p>
                )}
                {errors.expenseTypeId && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.expenseTypeId}
                  </p>
                )}
              </div>
            )}

            <label className="rbac-label">
              Date <span className="text-red-600">*</span>
              <CustomDatePicker
                value={form.date}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, date: value || getTodayInputDate() }))
                }
                className="mb-2"
                placeholder="Select date"
              />
            </label>
            {errors.date && (
              <p className="text-sm text-red-600 mb-2">{errors.date}</p>
            )}

            <label className="rbac-label">
              Remark
              <textarea
                className="rbac-input mb-2 min-h-24"
                placeholder="Remark"
                value={form.remark}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, remark: event.target.value }))
                }
              />
            </label>
          </fieldset>

          {note && <p className="text-sm text-red-600 mb-4">{note}</p>}

          <div className="rbac-actions">
            <button className="rbac-button" type="submit" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" size={16} />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
            <Link href="/dashboard/daily-expenses">
              <button className="text-red-500" type="button" disabled={saving}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
