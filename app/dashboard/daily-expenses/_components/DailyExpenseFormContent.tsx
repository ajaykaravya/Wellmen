"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { ButtonGroup } from "../../_components/ButtonGroup";
import { UserCardGroup } from "../../_components/UserCardGroup";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type TransactionType = "EXPENSE";

type PaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";


type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

type ExpenseTypeOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
};

type DailyExpenseFormState = {
  transactionType: TransactionType;
  amount: string;
  projectId: string;
  expenseTypeId: string;
  expenseById: string;
  expenseCompanyId: string;
  paymentMode: PaymentMode;
  date: string;
  remark: string;
};

type DailyExpenseFormContentProps = {
  dailyExpenseId?: string;
};

function getDisplayLabel(option: ExpenseTypeOption) {
  return option.name;
}

function getProjectLabel(option: ProjectOption) {
  return option.city ? `${option.name} (${option.city})` : option.name;
}

const paymentModeOptions: Array<{ key: PaymentMode; label: string }> = [
  { key: "CASH", label: "Cash" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "UPI", label: "UPI" },
  { key: "NEFT_RTGS", label: "NEFT/RTGS" },
];

export default function DailyExpenseFormContent({
  dailyExpenseId,
}: DailyExpenseFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<DailyExpenseFormState>({
    transactionType: "EXPENSE",
    amount: "",
    projectId: "",
    expenseTypeId: "",
    expenseById: "",
    expenseCompanyId: "",
    paymentMode: "CASH",
    date: getTodayInputDate(),
    remark: "",
  });
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [expenseTypeQuery, setExpenseTypeQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DailyExpenseFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, expenseTypesRes, usersRes, companiesRes, dailyExpenseRes] =
          await Promise.all([
            fetch("/api/projects/options"),
            fetch("/api/expense-types/options"),
            fetch("/api/users/options"),
            fetch("/api/companies/options"),
            dailyExpenseId
              ? fetch(`/api/daily-expenses/${dailyExpenseId}`)
              : Promise.resolve(null),
          ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load projects");
        }

        if (expenseTypesRes.ok) {
          const data = await expenseTypesRes.json();
          setExpenseTypes(
            Array.isArray(data)
              ? data.filter(
                (item: ExpenseTypeOption) => item.status === "ACTIVE",
              )
              : [],
          );
        } else {
          throw new Error("Failed to load expense types");
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load users");
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load companies");
        }

        if (dailyExpenseRes) {
          if (!dailyExpenseRes.ok) {
            setNote("Failed to load daily expense.");
            return;
          }

          const data = await dailyExpenseRes.json();
          setForm({
            transactionType: "EXPENSE",
            amount: String(data.amount ?? ""),
            projectId: data.projectId || "",
            expenseTypeId: data.expenseTypeId || "",
            expenseById: data.expenseById || "",
            paymentMode: data.paymentMode || "",
            expenseCompanyId: data.expenseCompanyId || "",
            date:
              formatToDDMMYYYY(data.date) === "-"
                ? getTodayInputDate()
                : formatToDDMMYYYY(data.date),
            remark: data.remark || "",
          });
          setProjectQuery(data.projectName ? getProjectLabel({ id: data.projectId || "", name: data.projectName, city: data.projectCity }) : "");
          setExpenseTypeQuery(data.expenseTypeName || "");
        }
      } catch (error) {
        console.error("Failed to load daily expense data", error);
        setNote("Failed to load daily expense data.");
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

  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      getProjectLabel(project).toLowerCase().includes(query),
    );
  }, [projectQuery, projects]);

  const selectedProject = useMemo(
    () => projects.find((option) => option.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof DailyExpenseFormState, string>> = {};
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!form.expenseTypeId) newErrors.expenseTypeId = "Expense type is required.";
    if (!form.expenseById) newErrors.expenseById = "Expense by is required.";
    if (!form.paymentMode) newErrors.paymentMode = "Payment mode is required.";
    if (!form.expenseCompanyId)
      newErrors.expenseCompanyId = "Expense company is required.";

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
            transactionType: "EXPENSE",
            amount: form.amount,
            projectId: form.projectId,
            expenseTypeId: form.expenseTypeId,
            expenseById: form.expenseById,
            expenseCompanyId: form.expenseCompanyId,
            paymentMode: form.paymentMode,
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


            <div className="mb-2">
              <ButtonGroup
                title="Expense Company"
                selected={form.expenseCompanyId}
                options={companies.map((company) => ({
                  key: company.id,
                  label: company.name,
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, expenseCompanyId: value }))
                }
                error={errors.expenseCompanyId}
                required
              />
            </div>
            <div className="mb-2">
              <UserCardGroup
                title="Expense By"
                selected={form.expenseById}
                users={users}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, expenseById: value }))
                }
                error={errors.expenseById}
                required
                emptyMessage="No users available to select."
              />
            </div>

            <div className="mb-2">
              <label className="rbac-label">
                Category <span className="text-red-600">*</span>
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
                    className="theme-input rbac-input w-full pr-10"
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
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
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
              {errors.expenseTypeId && (
                <p className="text-sm text-red-600 my-2">
                  {errors.expenseTypeId}
                </p>
              )}
            </div>

            <div className="mb-2">
              <label className="rbac-label">
                Project <span className="text-red-600">*</span>
              </label>
              <Combobox
                value={selectedProject}
                onChange={(project: ProjectOption | null) => {
                  setForm((prev) => ({
                    ...prev,
                    projectId: project?.id || "",
                  }));
                  setProjectQuery("");
                }}
                nullable
              >
                <div className="relative">
                  <ComboboxInput
                    className="theme-input rbac-input w-full pr-10"
                    placeholder="Search project"
                    displayValue={(project: ProjectOption | null) =>
                      project ? getProjectLabel(project) : projectQuery
                    }
                    onChange={(event) => {
                      setProjectQuery(event.target.value);
                      setForm((prev) => ({ ...prev, projectId: "" }));
                    }}
                  />
                  <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </ComboboxButton>
                  <ComboboxOptions
                    modal={false}
                    className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]"
                  >
                    {filteredProjects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-[color:var(--theme-text-muted)]">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <ComboboxOption
                          key={project.id}
                          value={project}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{getProjectLabel(project)}</span>
                          </div>
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </div>
              </Combobox>
              {errors.projectId && (
                <p className="my-2 text-sm text-red-600">{errors.projectId}</p>
              )}
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Payment Mode"
                selected={form.paymentMode}
                options={paymentModeOptions}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, paymentMode: value as PaymentMode }))
                }
                error={errors.paymentMode}
                required
              />
            </div>

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
