"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Loading from "../../../components/Loading";
import DashboardShell from "../../_components/DashboardShell";
import { ButtonGroup } from "../../_components/ButtonGroup";
import {
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  TRANSPORT_CONFIG_TYPE_LABELS,
  TRANSPORT_TYPES,
  TRIP_TYPE_OPTIONS,
} from "@/lib/transport-management";

type TransportConfigFormState = {
  transportType: string;
  configType: string;
  floor: string;
  loadType: string;
  minKm: string;
  maxKm: string;
  tripType: string;
  rate: string;
};

type TransportConfigFormContentProps = {
  transportConfigId?: string;
  initialTransportType?: string;
};

const transportTypeOptions = TRANSPORT_TYPES.filter((option) =>
  ["BOLERO_DELIVERY", "BOLERO_RETURN_DC", "COURIER_DAILY", "CNG_RICKSHAW"].includes(option.key),
).map((option) => ({
  key: option.key,
  label: option.label,
}));

const DEFAULT_TRANSPORT_TYPE = transportTypeOptions[0]?.key ?? "BOLERO_DELIVERY";

const CONFIG_TYPES_BY_TRANSPORT: Record<string, Array<{ key: string; label: string }>> = {
  BOLERO_DELIVERY: [
    { key: "DRIVER_WAGE_SLAB", label: "Driver Wage Slab" },
    { key: "FLOOR_RENT", label: "Floor Rent" },
  ],
  BOLERO_RETURN_DC: [
    { key: "DRIVER_WAGE_SLAB", label: "Driver Wage Slab" },
    { key: "FLOOR_RENT", label: "Floor Rent" },
  ],
  COURIER_DAILY: [
    { key: "COURIER_WEIGHT_RATE", label: "Courier Weight Rate" },
    { key: "COURIER_COVER_RATE", label: "Courier Cover Rate" },
  ],
  CNG_RICKSHAW: [{ key: "CNG_TRIP_SLAB", label: "CNG Trip Slab" }],
};

const getDefaultConfigType = (transportType: string) =>
  CONFIG_TYPES_BY_TRANSPORT[transportType]?.[0]?.key ?? "FLOOR_RENT";

const createEmptyForm = (transportType = "BOLERO_DELIVERY"): TransportConfigFormState => ({
  transportType,
  configType: getDefaultConfigType(transportType),
  floor: "",
  loadType: "",
  minKm: "",
  maxKm: "",
  tripType: "",
  rate: "",
});

const formatMoney = (value: string) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const clearRuleFields = (next: TransportConfigFormState, configType: string) => {
  next.floor = "";
  next.loadType = "";
  next.minKm = "";
  next.maxKm = "";
  next.tripType = "";

  if (configType === "FLOOR_RENT") {
    next.floor = "";
    next.loadType = "";
  } else if (configType === "DRIVER_WAGE_SLAB") {
    next.minKm = "";
    next.maxKm = "";
  } else if (configType === "CNG_TRIP_SLAB") {
    next.tripType = "";
    next.minKm = "";
    next.maxKm = "";
  }
  return next;
};

export default function TransportConfigFormContent({
  transportConfigId,
  initialTransportType,
}: TransportConfigFormContentProps) {
  const router = useRouter();
  const initialType = transportTypeOptions.some(
    (option) => option.key === initialTransportType,
  )
    ? initialTransportType
    : DEFAULT_TRANSPORT_TYPE;
  const [form, setForm] = useState<TransportConfigFormState>(
    createEmptyForm(initialType),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TransportConfigFormState, string>>
  >({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!transportConfigId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/transport-configs/${transportConfigId}`);
        if (!res.ok) {
          setNote("Failed to load transport config.");
          return;
        }

        const data = await res.json();
        const transportType = data.transportType || "BOLERO_DELIVERY";
        setForm({
          transportType,
          configType: data.configType || getDefaultConfigType(transportType),
          floor: data.floor || "",
          loadType: data.loadType || "",
          minKm: String(data.minKm ?? ""),
          maxKm: String(data.maxKm ?? ""),
          tripType: data.tripType || "",
          rate: String(data.rate ?? ""),
        });
      } catch (error) {
        console.error("Failed to load transport config", error);
        setNote("Failed to load transport config.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transportConfigId]);

  const configTypeOptions = useMemo(
    () => CONFIG_TYPES_BY_TRANSPORT[form.transportType] ?? [],
    [form.transportType],
  );

  const selectedTransportTypeLabel = useMemo(
    () =>
      TRANSPORT_TYPES.find((option) => option.key === form.transportType)
        ?.label || "Transport",
    [form.transportType],
  );

  const selectedConfigTypeLabel = useMemo(
    () =>
      TRANSPORT_CONFIG_TYPE_LABELS[form.configType] ||
      configTypeOptions.find((option) => option.key === form.configType)?.label ||
      "Config",
    [configTypeOptions, form.configType],
  );

  const updateTransportType = (value: string) => {
    setForm((prev) => {
      const nextType = value;
      const nextConfigType = getDefaultConfigType(nextType);
      return clearRuleFields(
        {
          ...createEmptyForm(nextType),
          rate: prev.rate,
          transportType: nextType,
          configType: nextConfigType,
        },
        nextConfigType,
      );
    });
    setErrors({});
  };

  const updateConfigType = (value: string) => {
    setForm((prev) =>
      clearRuleFields(
        {
          ...prev,
          configType: value,
        },
        value,
      ),
    );
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof TransportConfigFormState, string>> = {};
    if (!form.transportType.trim()) newErrors.transportType = "Transport type is required.";
    if (!form.configType.trim()) newErrors.configType = "Config type is required.";
    if (!form.rate.trim()) newErrors.rate = "Rate is required.";

    switch (form.configType) {
      case "FLOOR_RENT":
        if (!form.floor.trim()) newErrors.floor = "Floor is required.";
        if (!form.loadType.trim()) newErrors.loadType = "Load type is required.";
        break;
      case "DRIVER_WAGE_SLAB":
        if (!form.minKm.trim()) newErrors.minKm = "Min KM is required.";
        if (!form.maxKm.trim()) newErrors.maxKm = "Max KM is required.";
        break;
      case "CNG_TRIP_SLAB":
        if (!form.tripType.trim()) newErrors.tripType = "Trip type is required.";
        if (!form.minKm.trim()) newErrors.minKm = "Min KM is required.";
        if (!form.maxKm.trim()) newErrors.maxKm = "Max KM is required.";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        transportConfigId
          ? `/api/transport-configs/${transportConfigId}`
          : "/api/transport-configs",
        {
          method: transportConfigId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transportType: form.transportType,
            configType: form.configType,
            floor: form.floor,
            loadType: form.loadType,
            minKm: form.minKm,
            maxKm: form.maxKm,
            tripType: form.tripType,
            rate: form.rate,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save transport config.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        `Transport config ${transportConfigId ? "updated" : "created"} successfully.`,
      );
      router.push(
        `/dashboard/transport-configs?transportType=${encodeURIComponent(form.transportType)}`,
      );
    } catch (error) {
      console.error("Failed to save transport config", error);
      setNote("Failed to save transport config.");
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
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="rbac-title-lg">
                {transportConfigId ? "Edit Transport Config" : "Add New Transport Config"}
              </h3>
              <p className="rbac-muted">
                {selectedTransportTypeLabel} - {selectedConfigTypeLabel}
              </p>
            </div>
          </div>

          <form className="rbac-form" onSubmit={handleSubmit}>
            <fieldset
              disabled={saving}
              className={saving ? "opacity-70 pointer-events-none" : ""}
            >
              <ButtonGroup
                title="Transport Type"
                selected={form.transportType}
                options={transportTypeOptions}
                onSelect={(value) => updateTransportType(value)}
                required
                error={errors.transportType}
              />

              <div className="mt-4">
                <ButtonGroup
                  title="Config Type"
                  selected={form.configType}
                  options={configTypeOptions}
                  onSelect={(value) => updateConfigType(value)}
                  required
                  error={errors.configType}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                {form.configType === "FLOOR_RENT" && (
                  <>
                    <label className="rbac-label">
                      Floor <span className="text-red-600">*</span>
                      <select
                        className="rbac-input rbac-select mb-2"
                        value={form.floor}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, floor: event.target.value }))
                        }
                      >
                        <option value="">Select floor</option>
                        {FLOOR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.floor && (
                        <p className="text-sm text-red-600">{errors.floor}</p>
                      )}
                    </label>

                    <label className="rbac-label">
                      Load Type <span className="text-red-600">*</span>
                      <select
                        className="rbac-input rbac-select mb-2"
                        value={form.loadType}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            loadType: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select load type</option>
                        {LOAD_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.loadType && (
                        <p className="text-sm text-red-600">{errors.loadType}</p>
                      )}
                    </label>
                  </>
                )}

                {form.configType === "DRIVER_WAGE_SLAB" && (
                  <>
                    <label className="rbac-label">
                      Min KM <span className="text-red-600">*</span>
                      <input
                        className="rbac-input mb-2"
                        type="number"
                        step="1"
                        min="0"
                        value={form.minKm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, minKm: event.target.value }))
                        }
                      />
                      {errors.minKm && (
                        <p className="text-sm text-red-600">{errors.minKm}</p>
                      )}
                    </label>

                    <label className="rbac-label">
                      Max KM <span className="text-red-600">*</span>
                      <input
                        className="rbac-input mb-2"
                        type="number"
                        step="1"
                        min="0"
                        value={form.maxKm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, maxKm: event.target.value }))
                        }
                      />
                      {errors.maxKm && (
                        <p className="text-sm text-red-600">{errors.maxKm}</p>
                      )}
                    </label>
                  </>
                )}

                {form.configType === "CNG_TRIP_SLAB" && (
                  <>
                    <label className="rbac-label">
                      Trip Type <span className="text-red-600">*</span>
                      <select
                        className="rbac-input rbac-select mb-2"
                        value={form.tripType}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tripType: event.target.value }))
                        }
                      >
                        <option value="">Select trip type</option>
                        {TRIP_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {errors.tripType && (
                        <p className="text-sm text-red-600">{errors.tripType}</p>
                      )}
                    </label>

                    <label className="rbac-label">
                      Min KM <span className="text-red-600">*</span>
                      <input
                        className="rbac-input mb-2"
                        type="number"
                        step="1"
                        min="0"
                        value={form.minKm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, minKm: event.target.value }))
                        }
                      />
                      {errors.minKm && (
                        <p className="text-sm text-red-600">{errors.minKm}</p>
                      )}
                    </label>

                    <label className="rbac-label">
                      Max KM <span className="text-red-600">*</span>
                      <input
                        className="rbac-input mb-2"
                        type="number"
                        step="1"
                        min="0"
                        value={form.maxKm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, maxKm: event.target.value }))
                        }
                      />
                      {errors.maxKm && (
                        <p className="text-sm text-red-600">{errors.maxKm}</p>
                      )}
                    </label>
                  </>
                )}

                {form.configType === "COURIER_WEIGHT_RATE" && (
                  <div className="md:col-span-2 rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-sm text-slate-600">
                      Set the per KG courier rate.
                    </p>
                  </div>
                )}

                {form.configType === "COURIER_COVER_RATE" && (
                  <div className="md:col-span-2 rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-sm text-slate-600">
                      Set the per cover courier rate.
                    </p>
                  </div>
                )}

                <label className="rbac-label md:col-span-2">
                  Rate <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Rate"
                    value={form.rate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, rate: event.target.value }))
                    }
                  />
                  {errors.rate && <p className="text-sm text-red-600">{errors.rate}</p>}
                  <p className="text-xs text-slate-500">
                    Preview: ₹{formatMoney(form.rate)}
                  </p>
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
              <Link
                href={`/dashboard/transport-configs?transportType=${encodeURIComponent(form.transportType)}`}
              >
                <button className="text-red-500" type="button" disabled={saving}>
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </section>
    </DashboardShell>
  );
}
