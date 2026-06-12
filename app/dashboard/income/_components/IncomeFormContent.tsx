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
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CashEntryStepper from "../../_components/CashEntryStepper";
import CashEntrySuccessView from "../../_components/CashEntrySuccessView";
import SelectionCardGrid from "../../_components/SelectionCardGrid";
import SelectionPills from "../../_components/SelectionPills";
import { UserCardGroup } from "../../_components/UserCardGroup";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { incomeApi } from "@/lib/api/dashboard/income";
import {
  loadCompanyOptions,
  loadIncomeTypeOptions,
  loadProjectOptions,
  loadUserOptions,
  type CompanyOption,
  type IncomeTypeOption,
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

type PaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";

type IncomeFormState = {
  incomeTypeId: string;
  projectId: string;
  incomeCompanyId: string;
  receivedById: string;
  amount: string;
  paymentMode: PaymentMode;
  date: string;
  remark: string;
};

type IncomePayload = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  projectCity: string | null;
  incomeTypeId: string | null;
  incomeTypeName: string | null;
  incomeCompanyId: string | null;
  incomeCompanyName: string | null;
  receivedById: string | null;
  receivedByName: string | null;
  amount: number;
  paymentMode: PaymentMode | null;
  date: string;
  remark: string | null;
};

type IncomeFormContentProps = {
  incomeId?: string;
  onGoDashboard: () => void;
};

type IncomeSuccessEntry = {
  company: string;
  paymentMode: string;
  category: string;
  project: string;
  receivedBy: string;
  amount: string;
  date: string;
};

const cashEntrySteps = [
  { label: "Company" },
  { label: "Mode" },
  { label: "Category" },
  { label: "Details" },
] as const;

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

function getProjectLabel(project: ProjectOption) {
  return project.city ? `${project.name} (${project.city})` : project.name;
}

function getCompanyLabel(company: CompanyOption) {
  return company.name;
}

function getIncomeTypeLabel(incomeType: IncomeTypeOption) {
  return incomeType.name;
}

function isPrivilegedUser(user: UserOption) {
  const role = String(user.role || "").trim().toLowerCase();
  return role === "admin" || role === "manager";
}

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

const createInitialIncomeForm = (): IncomeFormState => ({
  incomeTypeId: "",
  projectId: "",
  incomeCompanyId: "",
  receivedById: "",
  amount: "",
  paymentMode: "CASH",
  date: getTodayInputDate(),
  remark: "",
});

export default function IncomeFormContent({
  incomeId,
  onGoDashboard,
}: IncomeFormContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeTypeOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedEntry, setSavedEntry] = useState<IncomeSuccessEntry | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncomeFormState, string>>
  >({});
  const [projectQuery, setProjectQuery] = useState("");
  const [incomeTypeQuery, setIncomeTypeQuery] = useState("");
  const [form, setForm] = useState<IncomeFormState>(createInitialIncomeForm());

  const clearError = (field: keyof IncomeFormState) => {
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, companies, incomeTypes, users, income] = await Promise.all([
          loadProjectOptions(),
          loadCompanyOptions(),
          loadIncomeTypeOptions(),
          loadUserOptions(),
          incomeId ? incomeApi.get(incomeId) : Promise.resolve(null),
        ]);

        setProjects(projects);
        setCompanies(companies);
        setIncomeTypes(
          incomeTypes.filter((incomeType) => incomeType.status === "ACTIVE"),
        );
        setUsers(users.filter((user) => isPrivilegedUser(user)));

        if (income) {
          const data = income as IncomePayload;
          setForm({
            incomeTypeId: data.incomeTypeId || "",
            projectId: data.projectId || "",
            incomeCompanyId: data.incomeCompanyId || "",
            receivedById: data.receivedById || "",
            amount: String(data.amount ?? ""),
            paymentMode: data.paymentMode || "CASH",
            date:
              formatToDDMMYYYY(data.date) === "-"
                ? getTodayInputDate()
                : formatToDDMMYYYY(data.date),
            remark: data.remark || "",
          });
          setProjectQuery(
            data.projectName
              ? getProjectLabel({
                id: data.projectId || "",
                name: data.projectName,
                city: data.projectCity,
              })
              : "",
          );
          setIncomeTypeQuery(data.incomeTypeName || "");
        }
      } catch (error) {
        console.error("Failed to load income data", error);
        setNote(
          error instanceof Error ? error.message : "Failed to load income data.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [incomeId]);

  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      getProjectLabel(project).toLowerCase().includes(query),
    );
  }, [projectQuery, projects]);

  const filteredIncomeTypes = useMemo(() => {
    const query = incomeTypeQuery.trim().toLowerCase();
    if (!query) return incomeTypes;
    return incomeTypes.filter((incomeType) =>
      getIncomeTypeLabel(incomeType).toLowerCase().includes(query),
    );
  }, [incomeTypeQuery, incomeTypes]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === form.incomeCompanyId) || null,
    [companies, form.incomeCompanyId],
  );

  const selectedPaymentModeLabel = useMemo(
    () => paymentModeOptions.find((option) => option.key === form.paymentMode)?.label || "",
    [form.paymentMode],
  );

  const selectedIncomeTypeLabel = useMemo(
    () => incomeTypes.find((incomeType) => incomeType.id === form.incomeTypeId)?.name || "",
    [form.incomeTypeId, incomeTypes],
  );

  const selectedReceivedByLabel = useMemo(
    () => {
      const user = users.find((item) => item.id === form.receivedById);
      return user ? `${user.firstName} ${user.lastName}`.trim() : "";
    },
    [form.receivedById, users],
  );

  const selectedSummaryItems = useMemo(
    () =>
      [
        currentStep > 0 && selectedCompany
          ? { label: selectedCompany.name, tone: "brand" as const }
          : null,
        currentStep > 1 && selectedPaymentModeLabel
          ? { label: selectedPaymentModeLabel, tone: "success" as const }
          : null,
        currentStep > 2 && selectedIncomeTypeLabel
          ? { label: selectedIncomeTypeLabel, tone: "warning" as const }
          : null,
      ].filter(Boolean) as Array<{ label: string; tone: "brand" | "success" | "warning" }>,
    [currentStep, selectedCompany, selectedIncomeTypeLabel, selectedPaymentModeLabel],
  );

  const resetToNewEntry = () => {
    setForm(createInitialIncomeForm());
    setCurrentStep(0);
    setSavedEntry(null);
    setErrors({});
    setNote(null);
    setProjectQuery("");
    setIncomeTypeQuery("");
  };

  const handleSave = async () => {
    setNote(null);
    const newErrors: Partial<Record<keyof IncomeFormState, string>> = {};
    if (!form.incomeCompanyId) {
      newErrors.incomeCompanyId = "Income company is required.";
    }
    if (!form.paymentMode) {
      newErrors.paymentMode = "Payment mode is required.";
    }
    if (!form.incomeTypeId) {
      newErrors.incomeTypeId = "Category is required.";
    }
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!form.receivedById) newErrors.receivedById = "Received by is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      const payload = {
        incomeTypeId: form.incomeTypeId,
        projectId: form.projectId,
        incomeCompanyId: form.incomeCompanyId,
        receivedById: form.receivedById,
        amount: form.amount,
        paymentMode: form.paymentMode,
        date: form.date,
        remark: form.remark,
      };

      if (incomeId) {
        await incomeApi.update(incomeId, payload);
      } else {
        await incomeApi.create(payload);
      }

      setSavedEntry({
        company: selectedCompany?.name || "-",
        paymentMode: selectedPaymentModeLabel || "-",
        category: selectedIncomeTypeLabel || "-",
        project: selectedProject ? getProjectLabel(selectedProject) : "-",
        receivedBy: selectedReceivedByLabel || "-",
        amount: `₹${Number(form.amount || 0).toFixed(2)}`,
        date: form.date,
      });
      toast.success(`Income ${incomeId ? "updated" : "created"} successfully.`);
    } catch (error) {
      console.error("Failed to save income", error);
      const message =
        error instanceof Error ? error.message : "Failed to save income.";
      setNote(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (savedEntry) {
    return (
      <CashEntrySuccessView
        title="Income Saved!"
        subtitle={`${savedEntry.amount} — ${savedEntry.category}`}
        details={[
          { label: "Company", value: savedEntry.company },
          { label: "Mode", value: savedEntry.paymentMode },
          { label: "Category", value: savedEntry.category },
          { label: "Party", value: savedEntry.project },
          { label: "Amount", value: savedEntry.amount },
          { label: "Date", value: savedEntry.date },
        ]}
        onAddAnother={resetToNewEntry}
        onDashboard={onGoDashboard}
      />
    );
  }

  return (
    <CashEntryStepper
      title={incomeId ? "Edit Income" : "Add New Income"}
      steps={cashEntrySteps}
      activeStep={currentStep}
      onBack={currentStep > 0 ? () => setCurrentStep((prev) => prev - 1) : undefined}
      onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
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
                selected={form.incomeCompanyId}
                options={companies.map((company, index) => ({
                  key: company.id,
                  label: getCompanyLabel(company),
                  subtitle: "Tap to select →",
                  icon: getCompanyCardIcon(index),
                  accentClassName: getCardTone(index),
                }))}
                onSelect={(value) => {
                  setForm((prev) => ({ ...prev, incomeCompanyId: value }));
                  clearError("incomeCompanyId");
                  goToNextStep();
                }}
                error={errors.incomeCompanyId}
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
                  columnsClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
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
                  selected={form.incomeTypeId}
                  options={filteredIncomeTypes.map((option, index) => ({
                    key: option.id,
                    label: option.name,
                    subtitle: "Tap to select →",
                    icon: <FaListCheck size={22} />,
                    accentClassName: getCardTone(index),
                  }))}
                  onSelect={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      incomeTypeId: value,
                    }));
                    setIncomeTypeQuery("");
                    clearError("incomeTypeId");
                    goToNextStep();
                  }}
                  error={errors.incomeTypeId}
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
                    setForm((prev) => ({ ...prev, projectId: project?.id || "" }));
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
                  title="Received By"
                  selected={form.receivedById}
                  users={users}
                  onSelect={(value) => {
                    setForm((prev) => ({ ...prev, receivedById: value }));
                    clearError("receivedById");
                  }}
                  error={errors.receivedById}
                  required
                  emptyMessage="No users available to select."
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
