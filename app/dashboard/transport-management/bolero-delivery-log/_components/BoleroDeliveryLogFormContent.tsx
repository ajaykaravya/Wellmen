"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "../../../../components/Loading";
import CustomDatePicker from "../../../../components/CustomDatePicker";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";
import {
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  calculateDriverWages,
  calculateFloorRent,
  calculateTotalAmount,
  calculateTotalKm,
} from "@/lib/boleroDeliveryLog";

type BoleroDeliveryLogFormState = {
  tripDate: string;
  tripDescription: string;
  locationType: string;
  city: string;
  floor: string;
  kmStart: string;
  kmEnd: string;
  loadType: string;
  otherExpenses: string;
  dcNumber: string;
  remark: string;
};

type BoleroDeliveryLogFormContentProps = {
  logId?: string;
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const formatted = formatToDDMMYYYY(value);
  return formatted === "-" ? "" : formatted;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BoleroDeliveryLogFormContent({
  logId,
}: BoleroDeliveryLogFormContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<BoleroDeliveryLogFormState>({
    tripDate: getTodayInputDate(),
    tripDescription: "",
    locationType: LOCATION_TYPE_OPTIONS[0],
    city: "",
    floor: FLOOR_OPTIONS[0],
    kmStart: "",
    kmEnd: "",
    loadType: LOAD_TYPE_OPTIONS[0],
    otherExpenses: "0",
    dcNumber: "",
    remark: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BoleroDeliveryLogFormState, string>>
  >({});

  useEffect(() => {
    const loadData = async () => {
      if (!logId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/transport-management/bolero-delivery-log/${logId}`);
        if (!res.ok) {
          setNote("Failed to load bolero delivery log.");
          return;
        }

        const data = await res.json();
        setForm({
          tripDate: formatDateForInput(data.tripDate),
          tripDescription: data.tripDescription || "",
          locationType: data.locationType || LOCATION_TYPE_OPTIONS[0],
          city: data.city || "",
          floor: data.floor || FLOOR_OPTIONS[0],
          kmStart: String(data.kmStart ?? ""),
          kmEnd: String(data.kmEnd ?? ""),
          loadType: data.loadType || LOAD_TYPE_OPTIONS[0],
          otherExpenses: String(data.otherExpenses ?? "0"),
          dcNumber: data.dcNumber || "",
          remark: data.remark || "",
        });
      } catch (error) {
        console.error("Failed to load bolero delivery log", error);
        setNote("Failed to load bolero delivery log.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [logId]);

  const computedValues = useMemo(() => {
    const kmStart = Number(form.kmStart);
    const kmEnd = Number(form.kmEnd);
    const otherExpenses = Number(form.otherExpenses || 0);
    const totalKm = calculateTotalKm(kmStart, kmEnd);
    const driverWages = calculateDriverWages(totalKm);
    const floorRent = calculateFloorRent(form.floor, form.loadType);
    const totalAmount = calculateTotalAmount({
      driverWages,
      otherExpenses,
      floorRent,
    });

    return {
      totalKm,
      driverWages,
      floorRent,
      totalAmount,
    };
  }, [form.floor, form.kmEnd, form.kmStart, form.loadType, form.otherExpenses]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof BoleroDeliveryLogFormState, string>> =
      {};

    if (!form.tripDate) newErrors.tripDate = "Trip date is required.";
    if (!form.tripDescription.trim())
      newErrors.tripDescription = "Trip description is required.";
    if (!form.locationType) newErrors.locationType = "Location type is required.";
    if (!form.floor) newErrors.floor = "Floor is required.";
    if (!form.kmStart.trim()) newErrors.kmStart = "KM start is required.";
    if (!form.kmEnd.trim()) newErrors.kmEnd = "KM end is required.";
    if (!form.loadType) newErrors.loadType = "Load type is required.";

    const kmStart = Number(form.kmStart);
    const kmEnd = Number(form.kmEnd);
    const otherExpenses = Number(form.otherExpenses || 0);

    if (form.kmStart.trim() && !Number.isFinite(kmStart)) {
      newErrors.kmStart = "KM start must be a number.";
    }
    if (form.kmEnd.trim() && !Number.isFinite(kmEnd)) {
      newErrors.kmEnd = "KM end must be a number.";
    }
    if (form.otherExpenses.trim() && !Number.isFinite(otherExpenses)) {
      newErrors.otherExpenses = "Other expenses must be a number.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        logId
          ? `/api/transport-management/bolero-delivery-log/${logId}`
          : "/api/transport-management/bolero-delivery-log",
        {
          method: logId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripDate: form.tripDate,
            tripDescription: form.tripDescription.trim(),
            locationType: form.locationType,
            city: form.city.trim(),
            floor: form.floor,
            kmStart: form.kmStart,
            kmEnd: form.kmEnd,
            loadType: form.loadType,
            otherExpenses: form.otherExpenses || "0",
            dcNumber: form.dcNumber.trim(),
            remark: form.remark.trim(),
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage =
          payload.error || "Failed to save bolero delivery log.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        `Bolero delivery log ${logId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/transport-management/bolero-delivery-log");
    } catch (error) {
      console.error("Failed to save bolero delivery log", error);
      setNote("Failed to save bolero delivery log.");
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
            {logId ? "Edit Bolero Delivery Log" : "Add New Bolero Delivery Log"}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "opacity-70 pointer-events-none" : ""}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Trip date <span className="text-red-600">*</span>
                <CustomDatePicker
                  value={form.tripDate}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, tripDate: value }))
                  }
                  placeholder="Select trip date"
                  className="mb-2"
                />
                {errors.tripDate && (
                  <p className="text-sm text-red-600 mb-2">{errors.tripDate}</p>
                )}
              </label>

              <label className="rbac-label">
                Location type <span className="text-red-600">*</span>
                <select
                  className="rbac-input mb-2"
                  value={form.locationType}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      locationType: event.target.value,
                    }))
                  }
                >
                  {LOCATION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.locationType && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.locationType}
                  </p>
                )}
              </label>
            </div>

            <label className="rbac-label">
              Trip description <span className="text-red-600">*</span>
              <textarea
                className="rbac-input mb-2"
                rows={3}
                placeholder="From-to or route details"
                value={form.tripDescription}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    tripDescription: event.target.value,
                  }))
                }
              />
            </label>
            {errors.tripDescription && (
              <p className="text-sm text-red-600 mb-2">
                {errors.tripDescription}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                City
                <input
                  className="rbac-input mb-2"
                  placeholder="City"
                  value={form.city}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
              </label>

              <label className="rbac-label">
                Floor <span className="text-red-600">*</span>
                <select
                  className="rbac-input mb-2"
                  value={form.floor}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, floor: event.target.value }))
                  }
                >
                  {FLOOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.floor && (
                  <p className="text-sm text-red-600 mb-2">{errors.floor}</p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                KM start <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="KM start"
                  value={form.kmStart}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, kmStart: event.target.value }))
                  }
                />
                {errors.kmStart && (
                  <p className="text-sm text-red-600 mb-2">{errors.kmStart}</p>
                )}
              </label>

              <label className="rbac-label">
                KM end <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="KM end"
                  value={form.kmEnd}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, kmEnd: event.target.value }))
                  }
                />
                {errors.kmEnd && (
                  <p className="text-sm text-red-600 mb-2">{errors.kmEnd}</p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Total KM
                <input
                  className="rbac-input mb-2"
                  type="number"
                  step="0.01"
                  readOnly
                  value={computedValues.totalKm.toFixed(2)}
                />
              </label>

              <label className="rbac-label">
                Load type <span className="text-red-600">*</span>
                <select
                  className="rbac-input mb-2"
                  value={form.loadType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, loadType: event.target.value }))
                  }
                >
                  {LOAD_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.loadType && (
                  <p className="text-sm text-red-600 mb-2">{errors.loadType}</p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Driver wages
                <input
                  className="rbac-input mb-2"
                  type="text"
                  readOnly
                  value={formatMoney(computedValues.driverWages)}
                />
              </label>

              <label className="rbac-label">
                Other expenses
                <input
                  className="rbac-input mb-2"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Fuel, toll, etc."
                  value={form.otherExpenses}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      otherExpenses: event.target.value,
                    }))
                  }
                />
                {errors.otherExpenses && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.otherExpenses}
                  </p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Floor rent
                <input
                  className="rbac-input mb-2"
                  type="text"
                  readOnly
                  value={formatMoney(computedValues.floorRent)}
                />
              </label>

              <label className="rbac-label">
                Total amount
                <input
                  className="rbac-input mb-2"
                  type="text"
                  readOnly
                  value={formatMoney(computedValues.totalAmount)}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rbac-label">
                DC number
                <input
                  className="rbac-input mb-2"
                  placeholder="DC number"
                  value={form.dcNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      dcNumber: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="rbac-label">
                Remark
                <textarea
                  className="rbac-input mb-2"
                  rows={3}
                  placeholder="Remark"
                  value={form.remark}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, remark: event.target.value }))
                  }
                />
              </label>
            </div>
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
            <Link href="/dashboard/transport-management/bolero-delivery-log">
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
