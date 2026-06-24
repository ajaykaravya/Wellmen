"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaBuilding,
  FaFileInvoiceDollar,
  FaHospital,
  FaMobileAlt,
  FaMoneyBillWave,
  FaSpinner,
  FaUniversity,
  FaWrench,
} from "react-icons/fa";
import { FaListCheck } from "react-icons/fa6";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CashEntryStepper from "../../_components/CashEntryStepper";
import CashEntrySuccessView from "../../_components/CashEntrySuccessView";
import SelectionCardGrid from "../../_components/SelectionCardGrid";
import SelectionPills from "../../_components/SelectionPills";
import { UserCardGroup } from "../../_components/UserCardGroup";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { dailyExpenseApi } from "@/lib/api/dashboard/daily-expenses";
import {
  loadCompanyOptions,
  loadExpenseTypeOptions,
  loadProjectOptions,
  loadUserOptions,
  type CompanyOption,
  type ExpenseTypeOption,
  type ProjectOption,
  type UserOption,
} from "@/lib/api/dashboard/shared-options";
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

type DailyExpenseSuccessEntry = {
  company: string;
  paymentMode: string;
  category: string;
  party: string;
  amount: string;
  date: string;
};

const cashEntrySteps = [
  { label: "Company" },
  { label: "Mode" },
  { label: "Category" },
  { label: "Details" },
] as const;

const createInitialDailyExpenseForm = (): DailyExpenseFormState => ({
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

function getDisplayLabel(option: ExpenseTypeOption) {
  return option.name;
}

function getProjectLabel(option: ProjectOption) {
  return option.city ? `${option.name} (${option.city})` : option.name;
}

const paymentModeOptions: Array<{ key: PaymentMode; label: string }> = [
  { key: "CASH", label: "Cash" },
  { key: "BANK", label: "Bank" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "UPI", label: "UPI" },
  { key: "NEFT_RTGS", label: "NEFT/RTGS" },
];

const paymentModeIcons: Record<PaymentMode, React.ReactNode> = {
  CASH: <FaMoneyBillWave size={22} />,
  BANK: <FaUniversity size={22} />,
  CHEQUE: <FaFileInvoiceDollar size={22} />,
  UPI: <FaMobileAlt size={22} />,
  NEFT_RTGS: <FaBolt size={22} />,
};

function getCompanyCardIcon(index: number) {
  const icons = [
    <FaBuilding key="company-building" size={22} />,
    <FaHospital key="company-hospital" size={22} />,
    <FaWrench key="company-wrench" size={22} />,
  ];
  return icons[index % icons.length];
}

function getCardTone(index: number) {
  const tones = [
    "border-sky-500/20",
    "border-emerald-500/20",
    "border-amber-500/20",
    "border-fuchsia-500/20",
    "border-rose-500/20",
  ];
  return tones[index % tones.length];
}

export default function DailyExpenseFormContent({
  dailyExpenseId,
}: DailyExpenseFormContentProps) {
  const [form, setForm] = useState<DailyExpenseFormState>(createInitialDailyExpenseForm());

  const clearError = (field: keyof DailyExpenseFormState) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, cashEntrySteps.length - 1));
  };
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [expenseTypeQuery, setExpenseTypeQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedEntry, setSavedEntry] = useState<DailyExpenseSuccessEntry | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DailyExpenseFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, expenseTypes, users, companies, dailyExpense] = await Promise.all([
          loadProjectOptions(),
          loadExpenseTypeOptions(),
          loadUserOptions(),
          loadCompanyOptions(),
          dailyExpenseId ? dailyExpenseApi.get(dailyExpenseId) : Promise.resolve(null),
        ]);

        setProjects(projects);
        setExpenseTypes(
          expenseTypes.filter((item) => item.status === "ACTIVE"),
        );
        setUsers(users);
        setCompanies(companies);

        if (dailyExpense) {
          const data = dailyExpense as {
            amount?: number;
            projectId?: string;
            expenseTypeId?: string;
            expenseById?: string;
            paymentMode?: PaymentMode;
            expenseCompanyId?: string;
            date?: string;
            remark?: string;
            projectName?: string | null;
            projectCity?: string | null;
            expenseTypeName?: string | null;
          };

          setForm({
            transactionType: "EXPENSE",
            amount: String(data.amount ?? ""),
            projectId: data.projectId || "",
            expenseTypeId: data.expenseTypeId || "",
            expenseById: data.expenseById || "",
            paymentMode: (data.paymentMode as PaymentMode) || "CASH",
            expenseCompanyId: data.expenseCompanyId || "",
            date:
              formatToDDMMYYYY(data.date) === "-"
                ? getTodayInputDate()
                : formatToDDMMYYYY(data.date),
            remark: data.remark || "",
          });
          setProjectQuery("");
          setExpenseTypeQuery("");
        }
      } catch (error) {
        console.error("Failed to load daily expense data", error);
        setNote(
          error instanceof Error ? error.message : "Failed to load daily expense data.",
        );
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

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === form.expenseCompanyId) || null,
    [companies, form.expenseCompanyId],
  );

  const selectedPaymentModeLabel = useMemo(
    () => paymentModeOptions.find((option) => option.key === form.paymentMode)?.label || "",
    [form.paymentMode],
  );

  const selectedExpenseTypeLabel = useMemo(
    () => expenseTypes.find((option) => option.id === form.expenseTypeId)?.name || "",
    [expenseTypes, form.expenseTypeId],
  );

  const selectedExpenseType = useMemo(
    () => expenseTypes.find((option) => option.id === form.expenseTypeId) || null,
    [expenseTypes, form.expenseTypeId],
  );

  const allowedExpenseByUsers = useMemo(() => {
    if (!selectedExpenseType) return [];
    const allowedIds = new Set((selectedExpenseType.users || []).map((user) => user.id));
    if (allowedIds.size === 0) return [];
    return users.filter((user) => allowedIds.has(user.id));
  }, [selectedExpenseType, users]);

  const selectedSummaryItems = useMemo(
    () =>
      [
        currentStep > 0 && selectedCompany
          ? { label: selectedCompany.name, tone: "brand" as const }
          : null,
        currentStep > 1 && selectedPaymentModeLabel
          ? { label: selectedPaymentModeLabel, tone: "success" as const }
          : null,
        currentStep > 2 && selectedExpenseTypeLabel
          ? { label: selectedExpenseTypeLabel, tone: "warning" as const }
          : null,
      ].filter(Boolean) as Array<{ label: string; tone: "brand" | "success" | "warning" }>,
    [currentStep, selectedCompany, selectedExpenseTypeLabel, selectedPaymentModeLabel],
  );

  const selectedExpenseById =
    allowedExpenseByUsers.some((user) => user.id === form.expenseById)
      ? form.expenseById
      : "";

  const resetToNewEntry = () => {
    setForm(createInitialDailyExpenseForm());
    setCurrentStep(0);
    setSavedEntry(null);
    setErrors({});
    setNote(null);
    setProjectQuery("");
    setExpenseTypeQuery("");
  };

  const handleSave = async () => {
    setNote(null);
    const newErrors: Partial<Record<keyof DailyExpenseFormState, string>> = {};
    if (!form.expenseCompanyId) {
      newErrors.expenseCompanyId = "Expense company is required.";
    }
    if (!form.paymentMode) {
      newErrors.paymentMode = "Payment mode is required.";
    }
    if (!form.expenseTypeId) {
      newErrors.expenseTypeId = "Expense type is required.";
    }
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!selectedExpenseById) newErrors.expenseById = "Expense by is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      const payload = {
        transactionType: "EXPENSE" as const,
        amount: form.amount,
        projectId: form.projectId,
        expenseTypeId: form.expenseTypeId,
        expenseById: selectedExpenseById,
        expenseCompanyId: form.expenseCompanyId,
        paymentMode: form.paymentMode,
        date: form.date,
        remark: form.remark,
      };

      if (dailyExpenseId) {
        await dailyExpenseApi.update(dailyExpenseId, payload);
      } else {
        await dailyExpenseApi.create(payload);
      }

      setSavedEntry({
        company: selectedCompany?.name || "-",
        paymentMode: selectedPaymentModeLabel || "-",
        category: selectedExpenseTypeLabel || "-",
        party: selectedProject ? getProjectLabel(selectedProject) : "-",
        amount: `₹${Number(form.amount || 0).toFixed(2)}`,
        date: form.date,
      });
      toast.success(
        `Daily expense ${dailyExpenseId ? "updated" : "created"} successfully.`,
      );
    } catch (error) {
      console.error("Failed to save daily expense", error);
      const message =
        error instanceof Error ? error.message : "Failed to save daily expense.";
      setNote(message);
      toast.error(message);
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

  if (savedEntry) {
    return (
      <CashEntrySuccessView
        title="Expense Saved!"
        subtitle={`${savedEntry.amount} — ${savedEntry.category}`}
        details={[
          { label: "Company", value: savedEntry.company },
          { label: "Mode", value: savedEntry.paymentMode },
          { label: "Category", value: savedEntry.category },
          { label: "Party", value: savedEntry.party },
          { label: "Amount", value: savedEntry.amount },
          { label: "Date", value: savedEntry.date },
        ]}
        onAddAnother={resetToNewEntry}
      />
    );
  }

  return (
    <CashEntryStepper
      title={dailyExpenseId ? "Edit Daily Expense" : "Add New Daily Expense"}
      steps={cashEntrySteps}
      activeStep={currentStep}
      onBack={currentStep > 0 ? () => setCurrentStep((prev) => prev - 1) : undefined}
      onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
      dailyExpenseId={dailyExpenseId || undefined}
    >
      <form className="rbac-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset
          disabled={saving}
          className={saving ? "opacity-70 pointer-events-none" : ""}
        >
          {currentStep === 0 && (
            <div className="mb-2">
              <SelectionCardGrid
                title="Select Company"
                selected={form.expenseCompanyId}
                options={companies.map((company, index) => ({
                  key: company.id,
                  label: company.name,
                  subtitle: "Tap to select →",
                  icon: getCompanyCardIcon(index),
                  accentClassName: getCardTone(index),
                }))}
                onSelect={(value) => {
                  setForm((prev) => ({ ...prev, expenseCompanyId: value }));
                  clearError("expenseCompanyId");
                  goToNextStep();
                }}
                error={errors.expenseCompanyId}
                required
                columnsClassName="grid grid-cols-1 gap-3"
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="mb-2">
              <SelectionPills items={selectedSummaryItems} />
              <div className="mt-4">
                <SelectionCardGrid
                  title="Type of Transaction"
                  selected={form.paymentMode}
                  options={paymentModeOptions.map((option) => ({
                    key: option.key,
                    label: option.label,
                    icon: paymentModeIcons[option.key],
                  }))}
                  onSelect={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      paymentMode: value as PaymentMode,
                    }));
                    clearError("paymentMode");
                    goToNextStep();
                  }}
                  error={errors.paymentMode}
                  required
                  columnsClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="mb-2">
              <SelectionPills items={selectedSummaryItems} />
              <div className="mt-4">
                <SelectionCardGrid
                  title="Select Category"
                  selected={form.expenseTypeId}
                  options={filteredExpenseTypes.map((option, index) => ({
                    key: option.id,
                    label: option.name,
                    subtitle: "Tap to select →",
                    icon: <FaListCheck size={22} />,
                    accentClassName: getCardTone(index),
                  }))}
                  onSelect={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      expenseTypeId: value,
                    }));
                    setExpenseTypeQuery("");
                    clearError("expenseTypeId");
                    goToNextStep();
                  }}
                  error={errors.expenseTypeId}
                  required
                  columnsClassName="grid grid-cols-1 gap-3"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <>
              <SelectionPills items={selectedSummaryItems} />
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
                    clearError("projectId");
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
                        clearError("projectId");
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
                  <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
                )}
              </div>

              <div className="mb-2">
                <UserCardGroup
                  title="Expense By"
                  selected={selectedExpenseById}
                  users={allowedExpenseByUsers}
                  onSelect={(value) => {
                    const expenseById = Array.isArray(value)
                      ? value[0] || ""
                      : value;
                    setForm((prev) => ({ ...prev, expenseById }));
                    clearError("expenseById");
                  }}
                  error={errors.expenseById}
                  required
                  emptyMessage={
                    selectedExpenseType && selectedExpenseType.users?.length === 0
                      ? "No users are assigned to this category."
                      : "No users available to select."
                  }
                />
              </div>

              <label className="rbac-label">
                Amount <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-1"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={form.amount}
                  onWheel={(event) => event.currentTarget.blur()}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, amount: event.target.value }));
                    clearError("amount");
                  }}
                />
              </label>
              {errors.amount && (
                <p className="mb-2 text-sm text-red-600">{errors.amount}</p>
              )}

              <label className="rbac-label">
                Date <span className="text-red-600">*</span>
                <CustomDatePicker
                  value={form.date}
                  onChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      date: value || getTodayInputDate(),
                    }));
                    clearError("date");
                  }}
                  className="mb-2"
                  placeholder="Select date"
                />
              </label>
              {errors.date && (
                <p className="mb-2 text-sm text-red-600">{errors.date}</p>
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <button
                  className="rbac-button"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <FaSpinner className="animate-spin" size={16} />
                      Saving...
                    </span>
                  ) : (
                    "Save Entry"
                  )}
                </button>
              </div>
            </>
          )}
        </fieldset>
      </form>

      {note && <p className="mt-4 text-sm text-red-600">{note}</p>}
    </CashEntryStepper>
  );
}
