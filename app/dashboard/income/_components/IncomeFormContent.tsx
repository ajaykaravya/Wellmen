"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import Link from "next/link";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { ButtonGroup } from "../../_components/ButtonGroup";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type PaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  role?: string | null;
};

type IncomeFormState = {
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
};

const paymentModeOptions: Array<{ key: PaymentMode; label: string }> = [
  { key: "CASH", label: "Cash" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "UPI", label: "UPI" },
  { key: "NEFT_RTGS", label: "NEFT/RTGS" },
];

function getProjectLabel(project: ProjectOption) {
  return project.city ? `${project.name} (${project.city})` : project.name;
}

function getCompanyLabel(company: CompanyOption) {
  return company.name;
}

function getUserLabel(user: UserOption) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return user.role ? `${name} (${user.role})` : name;
}

function isPrivilegedUser(user: UserOption) {
  const role = String(user.role || "").trim().toLowerCase();
  return role === "admin" || role === "manager";
}

export default function IncomeFormContent({ incomeId }: IncomeFormContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof IncomeFormState, string>>
  >({});
  const [projectQuery, setProjectQuery] = useState("");
  const [form, setForm] = useState<IncomeFormState>({
    projectId: "",
    incomeCompanyId: "",
    receivedById: "",
    amount: "",
    paymentMode: "CASH",
    date: getTodayInputDate(),
    remark: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, companiesRes, usersRes, incomeRes] =
          await Promise.all([
            fetch("/api/projects/options"),
            fetch("/api/companies/options"),
            fetch("/api/users/options"),
            incomeId ? fetch(`/api/income/${incomeId}`) : Promise.resolve(null),
          ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load projects");
        }

        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setCompanies(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load companies");
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(
            Array.isArray(data)
              ? data.filter((user: UserOption) => isPrivilegedUser(user))
              : [],
          );
        } else {
          throw new Error("Failed to load users");
        }

        if (incomeRes) {
          if (!incomeRes.ok) {
            setNote("Failed to load income.");
            return;
          }

          const data = (await incomeRes.json()) as IncomePayload;
          setForm({
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
          setProjectQuery(data.projectName ? getProjectLabel({ id: data.projectId || "", name: data.projectName, city: data.projectCity }) : "");
        }
      } catch (error) {
        console.error("Failed to load income data", error);
        setNote("Failed to load income data.");
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

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof IncomeFormState, string>> = {};
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!form.incomeCompanyId)
      newErrors.incomeCompanyId = "Income company is required.";
    if (!form.receivedById) newErrors.receivedById = "Received by is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (!form.paymentMode) newErrors.paymentMode = "Payment mode is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      const res = await fetch(incomeId ? `/api/income/${incomeId}` : "/api/income", {
        method: incomeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          incomeCompanyId: form.incomeCompanyId,
          receivedById: form.receivedById,
          amount: form.amount,
          paymentMode: form.paymentMode,
          date: form.date,
          remark: form.remark,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save income.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Income ${incomeId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/income");
    } catch (error) {
      console.error("Failed to save income", error);
      setNote("Failed to save income.");
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
        <div className="mb-4 flex items-center justify-between">
          <h3 className="rbac-title-lg">{incomeId ? "Edit Income" : "Add New Income"}</h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "opacity-70 pointer-events-none" : ""}
          >
         

            <div className="mb-2">
              <ButtonGroup
                title="Income Company"
                selected={form.incomeCompanyId}
                options={companies.map((company) => ({
                  key: company.id,
                  label: getCompanyLabel(company),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, incomeCompanyId: value }))
                }
                error={errors.incomeCompanyId}
                required
              />
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Received By"
                selected={form.receivedById}
                options={users.map((user) => ({
                  key: user.id,
                  label: getUserLabel(user),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, receivedById: value }))
                }
                error={errors.receivedById}
                required
              />
            </div>

               <div className="mb-2">
              <label className="rbac-label">
                Project <span className="text-red-600">*</span>
              </label>
              <Combobox
                value={selectedProject}
                onChange={(project: ProjectOption | null) => {
                  setForm((prev) => ({ ...prev, projectId: project?.id || "" }));
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
              <p className="mb-2 text-sm text-red-600">{errors.amount}</p>
            )}

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
            {errors.date && <p className="mb-2 text-sm text-red-600">{errors.date}</p>}

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

          {note && <p className="mb-4 text-sm text-red-600">{note}</p>}

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
            <Link href="/dashboard/income">
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
