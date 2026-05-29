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

type TransactionType = "CREDIT" | "DEBIT";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type PetiCashFormState = {
  amount: string;
  givenById: string;
  givenToId: string;
  companyId: string;
  projectId: string;
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
};

type PetiCashFormContentProps = {
  petiCashId?: string;
  defaultTransactionType?: TransactionType;
};

const isAdmin = (role?: string | null) => role === "Admin";
const isManager = (role?: string | null) => role === "Manager";
const isEmployee = (role?: string | null) => role !== "Admin" && role !== "Manager";

const getCompanyLabel = (company: CompanyOption) => company.name;

const getProjectLabel = (project: ProjectOption) =>
  project.city ? `${project.name} (${project.city})` : project.name;

export default function PetiCashFormContent({
  petiCashId,
  defaultTransactionType = "CREDIT",
}: PetiCashFormContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectQuery, setProjectQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PetiCashFormState, string>>>({});
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultTransactionType);
  const [form, setForm] = useState<PetiCashFormState>({
    amount: "",
    givenById: "",
    givenToId: "",
    companyId: "",
    projectId: "",
    date: getTodayInputDate(),
    remarks: "",
  });

  useEffect(() => {
    setTransactionType(defaultTransactionType);
  }, [defaultTransactionType]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, companiesRes, projectsRes, petiCashRes] = await Promise.all([
          fetch("/api/users/options"),
          fetch("/api/companies/options"),
          fetch("/api/projects/options"),
          petiCashId ? fetch(`/api/peti-cash/${petiCashId}`) : Promise.resolve(null),
        ]);

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

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load projects");
        }

        if (petiCashRes) {
          if (!petiCashRes.ok) {
            setNote("Failed to load peti cash.");
            return;
          }

          const data = (await petiCashRes.json()) as PetiCashPayload;
          setTransactionType(data.transactionType);
          setForm({
            amount: String(data.amount ?? ""),
            givenById: data.givenById || "",
            givenToId: data.givenToId || "",
            companyId: data.companyId || "",
            projectId: data.projectId || "",
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
        setNote("Failed to load peti cash data.");
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

  const title = petiCashId
    ? "Edit Peti Cash"
    : transactionType === "CREDIT"
      ? "Add Cash"
      : "Give Cash";

  const helperText =
    transactionType === "CREDIT"
      ? "Given by: Admin, Given to: Manager"
      : "Given by: Manager, Given to: Employee";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof PetiCashFormState, string>> = {};
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (!form.givenById) newErrors.givenById = "Given by is required.";
    if (!form.givenToId) newErrors.givenToId = "Given to is required.";
    if (!form.companyId) newErrors.companyId = "Company is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        petiCashId ? `/api/peti-cash/${petiCashId}` : "/api/peti-cash",
        {
          method: petiCashId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType,
            amount: form.amount,
            givenById: form.givenById,
            givenToId: form.givenToId,
            companyId: form.companyId,
            projectId: form.projectId,
            date: form.date,
            remarks: form.remarks,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save peti cash.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Peti cash ${petiCashId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/peti-cash");
    } catch (error) {
      console.error("Failed to save peti cash", error);
      setNote("Failed to save peti cash.");
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
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="rbac-title-lg">{title}</h3>
            <p className="text-sm text-slate-500">{helperText}</p>
          </div>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "pointer-events-none opacity-70" : ""}
          >
            <div className="mb-2">
              <UserCardGroup
                title="Given By"
                selected={form.givenById}
                users={givenByUsers}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, givenById: value }))
                }
                error={errors.givenById}
                required
                emptyMessage="No users available for this transaction type."
              />
            </div>

            <div className="mb-2">
              <UserCardGroup
                title="Given To"
                selected={form.givenToId}
                users={givenToUsers}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, givenToId: value }))
                }
                error={errors.givenToId}
                required
                emptyMessage="No users available for this transaction type."
              />
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Company"
                selected={form.companyId}
                options={companies.map((company) => ({
                  key: company.id,
                  label: getCompanyLabel(company),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, companyId: value }))
                }
                error={errors.companyId}
                required
              />
            </div>

            <div className="mb-2">
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

            <label className="rbac-label">
              Date <span className="text-red-600">*</span>
              <CustomDatePicker
                value={form.date}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    date: value || getTodayInputDate(),
                  }))
                }
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
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

            <div className="flex gap-3">
              <button className="rbac-button" type="submit">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              <Link href="/dashboard/peti-cash">
                <button className="rbac-button rbac-button-secondary" type="button">
                  Cancel
                </button>
              </Link>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
