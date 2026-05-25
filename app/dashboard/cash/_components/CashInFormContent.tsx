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

type PaymentMode = "CASH" | "BANK";

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

type CashInFormState = {
  date: string;
  cashGivenToId: string;
  cashGivenById: string;
  cashGivenFromCompanyId: string;
  amount: string;
  paymentMode: PaymentMode;
};

type CashInPayload = CashInFormState & {
  id: string;
};

type CashInFormContentProps = {
  cashInId?: string;
};

const paymentModeOptions: Array<{ key: PaymentMode; label: string }> = [
  { key: "CASH", label: "Cash" },
  { key: "BANK", label: "Bank" },
];

const isAdminManager = (role?: string | null) =>
  role === "Admin" || role === "Manager";

function getUserLabel(user: UserOption) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return user.role ? `${name} (${user.role})` : name;
}

function getCompanyLabel(company: CompanyOption) {
  return company.name;
}

export default function CashInFormContent({ cashInId }: CashInFormContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CashInFormState, string>>
  >({});
  const [form, setForm] = useState<CashInFormState>({
    date: getTodayInputDate(),
    cashGivenToId: "",
    cashGivenById: "",
    cashGivenFromCompanyId: "",
    amount: "",
    paymentMode: "CASH",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, companiesRes, cashInRes] = await Promise.all([
          fetch("/api/users/options"),
          fetch("/api/companies/options"),
          cashInId ? fetch(`/api/cash/${cashInId}`) : Promise.resolve(null),
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

        if (cashInRes) {
          if (!cashInRes.ok) {
            setNote("Failed to load cash.");
            return;
          }

          const data = (await cashInRes.json()) as CashInPayload;
          setForm({
            date: formatToDDMMYYYY(data.date) === "-" ? getTodayInputDate() : formatToDDMMYYYY(data.date),
            cashGivenToId: data.cashGivenToId || "",
            cashGivenById: data.cashGivenById || "",
            cashGivenFromCompanyId: data.cashGivenFromCompanyId || "",
            amount: String(data.amount ?? ""),
            paymentMode: data.paymentMode === "BANK" ? "BANK" : "CASH",
          });
        }
      } catch (error) {
        console.error("Failed to load cash data", error);
        setNote("Failed to load cash data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cashInId]);

  const cashGivenToUsers = useMemo(() => users, [users]);
  const cashGivenByUsers = useMemo(
    () => users.filter((user) => isAdminManager(user.role)),
    [users],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof CashInFormState, string>> = {};
    if (!form.date.trim()) newErrors.date = "Date is required.";
    if (!form.cashGivenToId) newErrors.cashGivenToId = "Cash given to is required.";
    if (!form.cashGivenById) newErrors.cashGivenById = "Cash given by is required.";
    if (!form.cashGivenFromCompanyId)
      newErrors.cashGivenFromCompanyId = "Cash given from company is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) {
      newErrors.amount = "Amount is required.";
    }
    if (!form.paymentMode) newErrors.paymentMode = "Payment mode is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSaving(true);
      const res = await fetch(
        cashInId ? `/api/cash/${cashInId}` : "/api/cash",
        {
          method: cashInId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: form.date,
            cashGivenToId: form.cashGivenToId,
            cashGivenById: form.cashGivenById,
            cashGivenFromCompanyId: form.cashGivenFromCompanyId,
            amount: form.amount,
            paymentMode: form.paymentMode,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save cash.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Cash ${cashInId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/cash");
    } catch (error) {
      console.error("Failed to save cash", error);
      setNote("Failed to save cash.");
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
          <h3 className="rbac-title-lg">
            {cashInId ? "Edit Cash" : "Add New Cash"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "pointer-events-none opacity-70" : ""}
          >
            <div className="mb-2">
              <ButtonGroup
                title="Cash Given To"
                selected={form.cashGivenToId}
                options={cashGivenToUsers.map((user) => ({
                  key: user.id,
                  label: getUserLabel(user),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, cashGivenToId: value }))
                }
                error={errors.cashGivenToId}
                required
              />
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Cash Given By"
                selected={form.cashGivenById}
                options={cashGivenByUsers.map((user) => ({
                  key: user.id,
                  label: getUserLabel(user),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, cashGivenById: value }))
                }
                error={errors.cashGivenById}
                required
              />
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Cash Given From Company"
                selected={form.cashGivenFromCompanyId}
                options={companies.map((company) => ({
                  key: company.id,
                  label: getCompanyLabel(company),
                }))}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, cashGivenFromCompanyId: value }))
                }
                error={errors.cashGivenFromCompanyId}
                required
              />
            </div>

            <div className="mb-2">
              <ButtonGroup
                title="Payment Mode"
                selected={form.paymentMode}
                options={paymentModeOptions}
                onSelect={(value) =>
                  setForm((prev) => ({ ...prev, paymentMode: value }))
                }
                error={errors.paymentMode}
                required
              />
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </label>
            {errors.amount && (
              <p className="mb-2 text-sm text-red-600">{errors.amount}</p>
            )}
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
            <Link href="/dashboard/cash">
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
