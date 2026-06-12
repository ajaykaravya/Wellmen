"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import CustomDatePicker from "../../../components/CustomDatePicker";
import UserSelectionCardGrid from "../../_components/UserSelectionCardGrid";
import PetiCashStepper from "../../_components/PetiCashStepper";
import SelectionCardGrid from "../../_components/SelectionCardGrid";
import SelectionPills from "../../_components/SelectionPills";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import { petiCashApi } from "@/lib/api/dashboard/peti-cash";
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
import {
  FaBuilding,
  FaHospital,
  FaSpinner,
  FaWrench,
} from "react-icons/fa";
import { FaListCheck } from "react-icons/fa6";

type TransactionType = "CREDIT" | "DEBIT";

type PetiCashStepKey = "givenBy" | "givenTo" | "company" | "category" | "details";

type PetiCashStep = {
  key: PetiCashStepKey;
  label: string;
};

type PetiCashFormState = {
  amount: string;
  givenById: string;
  givenToId: string;
  companyId: string;
  projectId: string;
  expenseTypeId: string;
  date: string;
  remarks: string;
};

type PetiCashPayload = PetiCashFormState & {
  id: string;
  transactionType: TransactionType;
  companyCode?: string | null;
  companyName?: string | null;
  projectName?: string | null;
  projectCity?: string | null;
  expenseTypeName?: string | null;
};

type PetiCashFormContentProps = {
  petiCashId?: string;
  defaultTransactionType?: TransactionType;
  backButton?: boolean;
  onBack?: () => void;
  onSaved?: () => void;
};

const isAdmin = (role?: string | null) => role === "Admin";
const isManager = (role?: string | null) => role === "Manager";
const isEmployee = (role?: string | null) => role !== "Admin" && role !== "Manager";

const getProjectLabel = (project: ProjectOption) =>
  project.city ? `${project.name} (${project.city})` : project.name;

function getUserDisplayName(user: UserOption) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

function getPetiCashSteps(transactionType: TransactionType): PetiCashStep[] {
  const baseSteps: PetiCashStep[] = [
    { key: "givenBy", label: "Given By" },
    { key: "givenTo", label: "Given To" },
    { key: "company", label: "Company" },
  ];

  if (transactionType === "DEBIT") {
    baseSteps.push({ key: "category", label: "Category" });
  }

  baseSteps.push({ key: "details", label: "Details" });
  return baseSteps;
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

export default function PetiCashFormContent({
  petiCashId,
  defaultTransactionType = "CREDIT",
  backButton = false,
  onBack,
  onSaved,
}: PetiCashFormContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseTypeOption[]>([]);
  const [projectQuery, setProjectQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PetiCashFormState, string>>>({});
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultTransactionType);
  const [form, setForm] = useState<PetiCashFormState>({
    amount: "",
    givenById: "",
    givenToId: "",
    companyId: "",
    projectId: "",
    expenseTypeId: "",
    date: getTodayInputDate(),
    remarks: "",
  });

  const steps = useMemo(() => getPetiCashSteps(transactionType), [transactionType]);
  const currentStepKey = steps[currentStep]?.key;

  const clearError = (field: keyof PetiCashFormState) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  useEffect(() => {
    setTransactionType(defaultTransactionType);
    setCurrentStep(0);
  }, [defaultTransactionType]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, companies, projects, expenseTypes, petiCash] = await Promise.all([
          loadUserOptions(),
          loadCompanyOptions(),
          loadProjectOptions(),
          loadExpenseTypeOptions(),
          petiCashId ? petiCashApi.get(petiCashId) : Promise.resolve(null),
        ]);

        setUsers(users);
        setCompanies(companies);
        setProjects(projects);
        setExpenseTypes(expenseTypes.filter((item) => item.status === "ACTIVE"));

        if (petiCash) {
          const data = petiCash as PetiCashPayload;
          setTransactionType(data.transactionType);
          setForm({
            amount: String(data.amount ?? ""),
            givenById: data.givenById || "",
            givenToId: data.givenToId || "",
            companyId: data.companyId || "",
            projectId: data.projectId || "",
            expenseTypeId: data.expenseTypeId || "",
            date:
              formatToDDMMYYYY(data.date) === "-"
                ? getTodayInputDate()
                : formatToDDMMYYYY(data.date),
            remarks: data.remarks || "",
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
        }
      } catch (error) {
        console.error("Failed to load peti cash data", error);
        setNote(
          error instanceof Error ? error.message : "Failed to load peti cash data.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [petiCashId]);

  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      getProjectLabel(project).toLowerCase().includes(query),
    );
  }, [projectQuery, projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const givenByUsers = useMemo(() => {
    if (transactionType === "CREDIT") {
      return users.filter((user) => isAdmin(user.role));
    }
    return users.filter((user) => isManager(user.role));
  }, [transactionType, users]);

  const givenToUsers = useMemo(() => {
    if (transactionType === "CREDIT") {
      return users.filter((user) => isManager(user.role));
    }
    return users.filter((user) => isEmployee(user.role));
  }, [transactionType, users]);

  const selectedGivenByLabel = useMemo(() => {
    const user = users.find((item) => item.id === form.givenById);
    return user ? getUserDisplayName(user) : "";
  }, [form.givenById, users]);

  const selectedGivenToLabel = useMemo(() => {
    const user = users.find((item) => item.id === form.givenToId);
    return user ? getUserDisplayName(user) : "";
  }, [form.givenToId, users]);

  const selectedCompanyLabel = useMemo(
    () => companies.find((company) => company.id === form.companyId)?.name || "",
    [companies, form.companyId],
  );

  const selectedExpenseTypeLabel = useMemo(
    () => expenseTypes.find((option) => option.id === form.expenseTypeId)?.name || "",
    [expenseTypes, form.expenseTypeId],
  );

  const selectedSummaryItems = useMemo(() => {
    const givenByIndex = steps.findIndex((step) => step.key === "givenBy");
    const givenToIndex = steps.findIndex((step) => step.key === "givenTo");
    const companyIndex = steps.findIndex((step) => step.key === "company");
    const categoryIndex = steps.findIndex((step) => step.key === "category");

    return [
      currentStep > givenByIndex && selectedGivenByLabel
        ? { label: selectedGivenByLabel, tone: "brand" as const }
        : null,
      currentStep > givenToIndex && selectedGivenToLabel
        ? { label: selectedGivenToLabel, tone: "success" as const }
        : null,
      currentStep > companyIndex && selectedCompanyLabel
        ? { label: selectedCompanyLabel, tone: "warning" as const }
        : null,
      categoryIndex >= 0 &&
      currentStep > categoryIndex &&
      selectedExpenseTypeLabel
        ? { label: selectedExpenseTypeLabel, tone: "default" as const }
        : null,
    ].filter(Boolean) as Array<{
      label: string;
      tone: "brand" | "success" | "warning" | "default";
    }>;
  }, [
    currentStep,
    selectedCompanyLabel,
    selectedExpenseTypeLabel,
    selectedGivenByLabel,
    selectedGivenToLabel,
    steps,
  ]);

  const title = petiCashId
    ? "Edit Peti Cash"
    : transactionType === "CREDIT"
      ? "Cash Received"
      : "Cash Spent";

  const handleStepperBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      return;
    }
    if (backButton && onBack) {
      onBack();
    }
  };

  const handleSave = async () => {
    setNote(null);

    const newErrors: Partial<Record<keyof PetiCashFormState, string>> = {};
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (!form.givenById) newErrors.givenById = "Given by is required.";
    if (!form.givenToId) newErrors.givenToId = "Given to is required.";
    if (!form.companyId) newErrors.companyId = "Company is required.";
    if (transactionType === "DEBIT" && !form.expenseTypeId) {
      newErrors.expenseTypeId = "Expense category is required.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        transactionType,
        amount: form.amount,
        givenById: form.givenById,
        givenToId: form.givenToId,
        companyId: form.companyId,
        projectId: form.projectId,
        expenseTypeId: transactionType === "DEBIT" ? form.expenseTypeId : "",
        date: form.date,
        remarks: form.remarks,
      };

      if (petiCashId) {
        await petiCashApi.update(petiCashId, payload);
      } else {
        await petiCashApi.create(payload);
      }

      toast.success(`Peti cash ${petiCashId ? "updated" : "created"} successfully.`);
      if (onSaved) {
        onSaved();
      } else {
        router.push("/dashboard/peti-cash");
      }
    } catch (error) {
      console.error("Failed to save peti cash", error);
      const message =
        error instanceof Error ? error.message : "Failed to save peti cash.";
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

  return (
    <PetiCashStepper
      title={title}
      steps={steps}
      activeStep={currentStep}
      onBack={
        currentStep > 0 || (backButton && onBack) ? handleStepperBack : undefined
      }
      onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
    >
      <form className="rbac-form" onSubmit={(event) => event.preventDefault()}>
        <fieldset
          disabled={saving}
          className={saving ? "pointer-events-none opacity-70" : ""}
        >
          {currentStepKey === "givenBy" && (
            <div className="mb-2">
              <UserSelectionCardGrid
                title="Given By"
                selected={form.givenById}
                users={givenByUsers}
                onSelect={(value) => {
                  setForm((prev) => ({ ...prev, givenById: value }));
                  clearError("givenById");
                  goToNextStep();
                }}
                error={errors.givenById}
                required
                emptyMessage="No users available for this transaction type."
              />
            </div>
          )}

          {currentStepKey === "givenTo" && (
            <div className="mb-2">
              <SelectionPills items={selectedSummaryItems} />
              <div className="mt-4">
                <UserSelectionCardGrid
                  title="Given To"
                  selected={form.givenToId}
                  users={givenToUsers}
                  onSelect={(value) => {
                    setForm((prev) => ({ ...prev, givenToId: value }));
                    clearError("givenToId");
                    goToNextStep();
                  }}
                  error={errors.givenToId}
                  required
                  emptyMessage="No users available for this transaction type."
                />
              </div>
            </div>
          )}

          {currentStepKey === "company" && (
            <div className="mb-2">
              <SelectionPills items={selectedSummaryItems} />
              <div className="mt-4">
                <SelectionCardGrid
                  title="Select Company"
                  selected={form.companyId}
                  options={companies.map((company, index) => ({
                    key: company.id,
                    label: company.name,
                    subtitle: "Tap to select →",
                    icon: getCompanyCardIcon(index),
                    accentClassName: getCardTone(index),
                  }))}
                  onSelect={(value) => {
                    setForm((prev) => ({ ...prev, companyId: value }));
                    clearError("companyId");
                    goToNextStep();
                  }}
                  error={errors.companyId}
                  required
                  columnsClassName="grid grid-cols-1 gap-3"
                />
              </div>
            </div>
          )}

          {currentStepKey === "category" && (
            <div className="mb-2">
              <SelectionPills items={selectedSummaryItems} />
              <div className="mt-4">
                <SelectionCardGrid
                  title="Select Category"
                  selected={form.expenseTypeId}
                  options={expenseTypes.map((option, index) => ({
                    key: option.id,
                    label: option.name,
                    subtitle: "Tap to select →",
                    icon: <FaListCheck size={22} />,
                    accentClassName: getCardTone(index),
                  }))}
                  onSelect={(value) => {
                    setForm((prev) => ({ ...prev, expenseTypeId: value }));
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

          {currentStepKey === "details" && (
            <>
              <SelectionPills items={selectedSummaryItems} />

              {transactionType === "DEBIT" && (
                <div className="mb-2 mt-4">
                  <label className="rbac-label">Project</label>
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
                              <span>{getProjectLabel(project)}</span>
                            </ComboboxOption>
                          ))
                        )}
                      </ComboboxOptions>
                    </div>
                  </Combobox>
                </div>
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
                Amount <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
                  type="number"
                  min="0"
                  step="0.01"
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
                Remarks
                <textarea
                  className="rbac-input mb-2"
                  rows={4}
                  placeholder="Remarks"
                  value={form.remarks}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, remarks: event.target.value }))
                  }
                />
              </label>

              {note && <p className="mb-2 text-sm text-red-600">{note}</p>}

              <div className="flex gap-3 pt-2">
                <button className="rbac-button" type="button" onClick={handleSave}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <FaSpinner className="animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
                {backButton && onBack ? (
                  <button
                    className="rbac-button rbac-button-secondary"
                    type="button"
                    onClick={onBack}
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    className="rbac-button rbac-button-secondary"
                    type="button"
                    onClick={() => router.push("/dashboard/peti-cash")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </fieldset>
      </form>
    </PetiCashStepper>
  );
}
