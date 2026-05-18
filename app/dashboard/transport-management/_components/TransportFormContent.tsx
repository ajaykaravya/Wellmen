"use client";

import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import Loading from "../../../components/Loading";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { ButtonGroup } from "../../_components/ButtonGroup";
import {
  CNG_STATUS_OPTIONS,
  COURIER_STATUS_OPTIONS,
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  LOADING_STATUS_OPTIONS,
  LOADING_VEHICLE_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  PORTER_STATUS_OPTIONS,
  TRIP_TYPE_OPTIONS,
  TRANSPORT_TYPES,
  getCngTripCharge,
  getCourierCharges,
  getDriverWages,
  getFloorRent,
  getLoadingVehicleTotal,
  getPorterCharges,
  getTransportTypeLabel,
  getTransportTypeShortLabel,
} from "@/lib/transport-management";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";

type TransportType = (typeof TRANSPORT_TYPES)[number]["key"];

type TransportFormState = {
  transportType: TransportType;
  date: string;
  dcNumber: string;
  tripDescription: string;
  locationType: string;
  city: string;
  floor: string;
  kmStart: string;
  kmEnd: string;
  totalKm: string;
  loadType: string;
  otherExpenses: string;
  courierNumber: string;
  description: string;
  fromLocation: string;
  toLocation: string;
  mobileNumber: string;
  noOfCovers: string;
  totalWeight: string;
  materialDescription: string;
  vehicleNumber: string;
  baseAmount: string;
  tripType: string;
  vehicleType: string;
  loadingCharges: string;
  returnMaterialCharges: string;
  transportCharges: string;
  paymentMode: string;
  status: string;
  remark: string;
};

type TransportFormContentProps = {
  transportId?: string;
};

const emptyForm = (
  transportType: TransportType = "BOLERO_DELIVERY",
  date = getTodayInputDate(),
): TransportFormState => ({
  transportType,
  date,
  dcNumber: "",
  tripDescription: "",
  locationType: "",
  city: "",
  floor: "",
  kmStart: "",
  kmEnd: "",
  totalKm: "",
  loadType: "",
  otherExpenses: "",
  courierNumber: "",
  description: "",
  fromLocation: "",
  toLocation: "",
  mobileNumber: "",
  noOfCovers: "",
  totalWeight: "",
  materialDescription: "",
  vehicleNumber: "",
  baseAmount: "",
  tripType: "",
  vehicleType: "",
  loadingCharges: "",
  returnMaterialCharges: "",
  transportCharges: "",
  paymentMode: "",
  status: "",
  remark: "",
});

const currency = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const numberOrZero = (value: string) => Number(value || 0);

export default function TransportFormContent({
  transportId,
}: TransportFormContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = useMemo(() => {
    const raw = (searchParams.get("type") || "").toUpperCase();
    return TRANSPORT_TYPES.some((option) => option.key === raw)
      ? (raw as TransportType)
      : "BOLERO_DELIVERY";
  }, [searchParams]);
  const [form, setForm] = useState<TransportFormState>(
    emptyForm(initialType),
  );
  const [serialNo, setSerialNo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!transportId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const res = await fetch(`/api/transport-management/${transportId}`);
        if (!res.ok) {
          setNote("Failed to load transport log.");
          return;
        }

        const data = await res.json();
        setSerialNo(typeof data.serialNo === "number" ? data.serialNo : null);
        setForm({
          transportType: data.transportType || "BOLERO_DELIVERY",
          date: formatToDDMMYYYY(data.date) === "-" ? getTodayInputDate() : formatToDDMMYYYY(data.date),
          dcNumber: data.dcNumber || "",
          tripDescription: data.tripDescription || "",
          locationType: data.locationType || "",
          city: data.city || "",
          floor: data.floor || "",
          kmStart: String(data.kmStart ?? ""),
          kmEnd: String(data.kmEnd ?? ""),
          totalKm: String(data.totalKm ?? ""),
          loadType: data.loadType || "",
          otherExpenses: String(data.otherExpenses ?? ""),
          courierNumber: data.courierNumber || "",
          description: data.description || "",
          fromLocation: data.fromLocation || "",
          toLocation: data.toLocation || "",
          mobileNumber: data.mobileNumber || "",
          noOfCovers: String(data.noOfCovers ?? ""),
          totalWeight: String(data.totalWeight ?? ""),
          materialDescription: data.materialDescription || "",
          vehicleNumber: data.vehicleNumber || "",
          baseAmount: String(data.baseAmount ?? ""),
          tripType: data.tripType || "",
          vehicleType: data.vehicleType || "",
          loadingCharges: String(data.loadingCharges ?? ""),
          returnMaterialCharges: String(data.returnMaterialCharges ?? ""),
          transportCharges: String(data.transportCharges ?? ""),
          paymentMode: data.paymentMode || "",
          status: data.status || "",
          remark: data.remark || "",
        });
      } catch (error) {
        console.error("Failed to load transport log", error);
        setNote("Failed to load transport log.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transportId]);

  const selectedTypeLabel = useMemo(
    () => getTransportTypeLabel(form.transportType),
    [form.transportType],
  );

  const transportTypeOptions = useMemo(
    () =>
      TRANSPORT_TYPES.map((option) => ({
        key: option.key,
        label: option.label,
      })),
    [],
  );

  const boleroTotalKm = useMemo(
    () => Math.max(0, numberOrZero(form.kmEnd) - numberOrZero(form.kmStart)),
    [form.kmEnd, form.kmStart],
  );

  const boleroDriverWages = useMemo(
    () => getDriverWages(boleroTotalKm),
    [boleroTotalKm],
  );

  const boleroFloorRent = useMemo(
    () => getFloorRent(form.transportType, form.floor, form.loadType),
    [form.floor, form.loadType, form.transportType],
  );

  const courierCharges = useMemo(
    () =>
      getCourierCharges(numberOrZero(form.totalWeight), numberOrZero(form.noOfCovers)),
    [form.noOfCovers, form.totalWeight],
  );

  const porterCharges = useMemo(
    () => getPorterCharges(numberOrZero(form.baseAmount)),
    [form.baseAmount],
  );

  const cngTripCharge = useMemo(
    () => getCngTripCharge(numberOrZero(form.totalKm), form.tripType || null),
    [form.totalKm, form.tripType],
  );

  const loadingVehicleTotal = useMemo(
    () =>
      getLoadingVehicleTotal(
        numberOrZero(form.loadingCharges),
        numberOrZero(form.returnMaterialCharges),
        numberOrZero(form.transportCharges),
        numberOrZero(form.otherExpenses),
      ),
    [
      form.loadingCharges,
      form.otherExpenses,
      form.returnMaterialCharges,
      form.transportCharges,
    ],
  );

  const handleTypeChange = (value: TransportType) => {
    setForm((prev) => ({
      ...emptyForm(value, prev.date || getTodayInputDate()),
      date: prev.date || getTodayInputDate(),
    }));
    setErrors({});
  };

  const setField = (field: keyof TransportFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<string, string>> = {};

    if (!form.date) nextErrors.date = "Date is required.";

    switch (form.transportType) {
      case "BOLERO_DELIVERY":
      case "BOLERO_RETURN_DC":
        if (!form.tripDescription.trim()) nextErrors.tripDescription = "Trip description is required.";
        if (!form.locationType.trim()) nextErrors.locationType = "Location type is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.floor.trim()) nextErrors.floor = "Floor is required.";
        if (!form.kmStart.trim()) nextErrors.kmStart = "KM start is required.";
        if (!form.kmEnd.trim()) nextErrors.kmEnd = "KM end is required.";
        if (!form.loadType.trim()) nextErrors.loadType = "Load type is required.";
        break;
      case "COURIER_DAILY":
        if (!form.courierNumber.trim()) nextErrors.courierNumber = "Courier number is required.";
        if (!form.description.trim()) nextErrors.description = "Description is required.";
        if (!form.fromLocation.trim()) nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim()) nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.noOfCovers.trim()) nextErrors.noOfCovers = "No. of covers is required.";
        if (!form.totalWeight.trim()) nextErrors.totalWeight = "Total weight is required.";
        break;
      case "PORTER_DAILY":
        if (!form.materialDescription.trim()) nextErrors.materialDescription = "Material description is required.";
        if (!form.fromLocation.trim()) nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim()) nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.baseAmount.trim()) nextErrors.baseAmount = "Base amount is required.";
        break;
      case "CNG_RICKSHAW":
        if (!form.dcNumber.trim()) nextErrors.dcNumber = "DC number is required.";
        if (!form.tripType.trim()) nextErrors.tripType = "Trip type is required.";
        if (!form.fromLocation.trim()) nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim()) nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City/route is required.";
        if (!form.totalKm.trim()) nextErrors.totalKm = "Total KM is required.";
        break;
      case "LOADING_VEHICLE":
        if (!form.vehicleType.trim()) nextErrors.vehicleType = "Vehicle type is required.";
        if (!form.fromLocation.trim()) nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim()) nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City/route is required.";
        if (!form.materialDescription.trim()) nextErrors.materialDescription = "Material description is required.";
        break;
      default:
        break;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const basePayload: Record<string, unknown> = {
      transportType: form.transportType,
      date: form.date,
      dcNumber: form.dcNumber,
      tripDescription: form.tripDescription,
      locationType: form.locationType,
      city: form.city,
      floor: form.floor,
      kmStart: form.kmStart,
      kmEnd: form.kmEnd,
      totalKm: form.totalKm,
      loadType: form.loadType,
      otherExpenses: form.otherExpenses,
      courierNumber: form.courierNumber,
      description: form.description,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      mobileNumber: form.mobileNumber,
      noOfCovers: form.noOfCovers,
      totalWeight: form.totalWeight,
      materialDescription: form.materialDescription,
      vehicleNumber: form.vehicleNumber,
      baseAmount: form.baseAmount,
      tripType: form.tripType,
      vehicleType: form.vehicleType,
      loadingCharges: form.loadingCharges,
      returnMaterialCharges: form.returnMaterialCharges,
      transportCharges: form.transportCharges,
      paymentMode: form.paymentMode,
      status: form.status,
      remark: form.remark,
    };

    return basePayload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (!validate()) return;

    try {
      setSaving(true);
      const res = await fetch(
        transportId ? `/api/transport-management/${transportId}` : "/api/transport-management",
        {
          method: transportId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save transport log.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        `Transport log ${transportId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/transport-management");
    } catch (error) {
      console.error("Failed to save transport log", error);
      setNote("Failed to save transport log.");
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
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="rbac-title-lg">
              {transportId ? `Edit ${selectedTypeLabel}` : `Add ${selectedTypeLabel}`}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex rounded-full bg-[#2596be] px-3 py-1 text-xs font-medium text-white">
              {transportId ? `Serial #${serialNo ?? "-"}` : "Auto serial number"}
            </span>
            <span className="text-xs text-slate-500">
              {getTransportTypeShortLabel(form.transportType)}
            </span>
          </div>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving}
            className={saving ? "opacity-70 pointer-events-none" : ""}
          >
            <div className="mb-4">
              <ButtonGroup
                title="Transport Type"
                selected={form.transportType}
                options={transportTypeOptions}
                onSelect={(value) => handleTypeChange(value as TransportType)}
                required
                disabled={!!transportId}
              />
            </div>
            {errors.transportType && (
              <p className="text-sm text-red-600 mb-2">{errors.transportType}</p>
            )}

            <label className="rbac-label">
              Date <span className="text-red-600">*</span>
              <CustomDatePicker
                value={form.date}
                onChange={(value) => setField("date", value)}
                placeholder="DD/MM/YYYY"
                className="rbac-input mb-2"
              />
            </label>
            {errors.date && <p className="text-sm text-red-600 mb-2">{errors.date}</p>}

            {form.transportType === "BOLERO_DELIVERY" ||
            form.transportType === "BOLERO_RETURN_DC" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rbac-label md:col-span-2">
                  Trip Description <span className="text-red-600">*</span>
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Trip description"
                    value={form.tripDescription}
                    onChange={(event) => setField("tripDescription", event.target.value)}
                  />
                </label>
                {errors.tripDescription && (
                  <p className="text-sm text-red-600 md:col-span-2">
                    {errors.tripDescription}
                  </p>
                )}

                <label className="rbac-label">
                  Location Type <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.locationType}
                    onChange={(event) => setField("locationType", event.target.value)}
                  >
                    <option value="">Select location type</option>
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  City <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Floor <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.floor}
                    onChange={(event) => setField("floor", event.target.value)}
                  >
                    <option value="">Select floor</option>
                    {FLOOR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  Load Type <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.loadType}
                    onChange={(event) => setField("loadType", event.target.value)}
                  >
                    <option value="">Select load type</option>
                    {LOAD_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  KM Start <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="1"
                    min="0"
                    value={form.kmStart}
                    onChange={(event) => setField("kmStart", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  KM End <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="1"
                    min="0"
                    value={form.kmEnd}
                    onChange={(event) => setField("kmEnd", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  DC Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="DC-001"
                    value={form.dcNumber}
                    onChange={(event) => setField("dcNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Other Expenses
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.otherExpenses}
                    onChange={(event) => setField("otherExpenses", event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total KM</p>
                    <p className="text-lg font-semibold">{boleroTotalKm}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Driver Wages</p>
                    <p className="text-lg font-semibold">₹{currency(boleroDriverWages)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">
                      {form.transportType === "BOLERO_RETURN_DC"
                        ? "Return Material Freight"
                        : "Floor Rent"}
                    </p>
                    <p className="text-lg font-semibold">₹{currency(boleroFloorRent)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(boleroDriverWages + boleroFloorRent + numberOrZero(form.otherExpenses))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {form.transportType === "COURIER_DAILY" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  Courier Number <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="CUR-001"
                    value={form.courierNumber}
                    onChange={(event) => setField("courierNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  City <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                <label className="rbac-label md:col-span-2">
                  Description <span className="text-red-600">*</span>
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Description"
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  From Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Pickup location"
                    value={form.fromLocation}
                    onChange={(event) => setField("fromLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  To Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Delivery location"
                    value={form.toLocation}
                    onChange={(event) => setField("toLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Mobile Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={(event) => setField("mobileNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  No. of Covers <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="1"
                    min="0"
                    value={form.noOfCovers}
                    onChange={(event) => setField("noOfCovers", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Total Weight (KG) <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.totalWeight}
                    onChange={(event) => setField("totalWeight", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Other Expenses
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.otherExpenses}
                    onChange={(event) => setField("otherExpenses", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Status
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option value="">Select status</option>
                    {COURIER_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label md:col-span-2">
                  Remark
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Remark"
                    value={form.remark}
                    onChange={(event) => setField("remark", event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Weight Charge</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(courierCharges.weightCharge)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Cover Charge</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(courierCharges.coverCharge)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(courierCharges.totalAmount + numberOrZero(form.otherExpenses))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {form.transportType === "PORTER_DAILY" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  DC Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="DC-P001"
                    value={form.dcNumber}
                    onChange={(event) => setField("dcNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  City <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                <label className="rbac-label md:col-span-2">
                  Material Description <span className="text-red-600">*</span>
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Material description"
                    value={form.materialDescription}
                    onChange={(event) => setField("materialDescription", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  From Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Pickup location"
                    value={form.fromLocation}
                    onChange={(event) => setField("fromLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  To Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Delivery location"
                    value={form.toLocation}
                    onChange={(event) => setField("toLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Vehicle Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Vehicle number"
                    value={form.vehicleNumber}
                    onChange={(event) => setField("vehicleNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Mobile Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={(event) => setField("mobileNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Base Amount <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.baseAmount}
                    onChange={(event) => setField("baseAmount", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Status
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option value="">Select status</option>
                    {PORTER_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  Payment Mode
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.paymentMode}
                    onChange={(event) => setField("paymentMode", event.target.value)}
                  >
                    <option value="">Select payment mode</option>
                    {PAYMENT_MODE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label md:col-span-2">
                  Remark
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Remark"
                    value={form.remark}
                    onChange={(event) => setField("remark", event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">GST</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(porterCharges.gstAmount)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(porterCharges.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {form.transportType === "CNG_RICKSHAW" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  DC Number <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="DC-CNG-001"
                    value={form.dcNumber}
                    onChange={(event) => setField("dcNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Trip Type <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.tripType}
                    onChange={(event) => setField("tripType", event.target.value)}
                  >
                    <option value="">Select trip type</option>
                    {TRIP_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  From Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Pickup point"
                    value={form.fromLocation}
                    onChange={(event) => setField("fromLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  To Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Delivery point"
                    value={form.toLocation}
                    onChange={(event) => setField("toLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  City/Route <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City or route"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Total KM <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="1"
                    min="0"
                    value={form.totalKm}
                    onChange={(event) => setField("totalKm", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Vehicle Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Vehicle number"
                    value={form.vehicleNumber}
                    onChange={(event) => setField("vehicleNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Mobile Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={(event) => setField("mobileNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Other Expenses
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.otherExpenses}
                    onChange={(event) => setField("otherExpenses", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Payment Mode
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.paymentMode}
                    onChange={(event) => setField("paymentMode", event.target.value)}
                  >
                    <option value="">Select payment mode</option>
                    {PAYMENT_MODE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  Status
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option value="">Select status</option>
                    {CNG_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label md:col-span-2">
                  Remark
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Remark"
                    value={form.remark}
                    onChange={(event) => setField("remark", event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Trip Charge</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(cngTripCharge)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold">
                      ₹{currency(cngTripCharge + numberOrZero(form.otherExpenses))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {form.transportType === "LOADING_VEHICLE" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  DC Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="DC-LV-001"
                    value={form.dcNumber}
                    onChange={(event) => setField("dcNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Vehicle Type <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.vehicleType}
                    onChange={(event) => setField("vehicleType", event.target.value)}
                  >
                    <option value="">Select vehicle type</option>
                    {LOADING_VEHICLE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  Vehicle Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Vehicle number"
                    value={form.vehicleNumber}
                    onChange={(event) => setField("vehicleNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Mobile Number
                  <input
                    className="rbac-input mb-2"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={(event) => setField("mobileNumber", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  From Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Pickup point"
                    value={form.fromLocation}
                    onChange={(event) => setField("fromLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  To Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="Delivery point"
                    value={form.toLocation}
                    onChange={(event) => setField("toLocation", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  City/Route <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City or route"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                <label className="rbac-label md:col-span-2">
                  Material Description <span className="text-red-600">*</span>
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Material description"
                    value={form.materialDescription}
                    onChange={(event) => setField("materialDescription", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Loading Charges
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.loadingCharges}
                    onChange={(event) => setField("loadingCharges", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Return Material Charges
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.returnMaterialCharges}
                    onChange={(event) => setField("returnMaterialCharges", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Transport Charges
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.transportCharges}
                    onChange={(event) => setField("transportCharges", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Other Expenses
                  <input
                    className="rbac-input mb-2"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.otherExpenses}
                    onChange={(event) => setField("otherExpenses", event.target.value)}
                  />
                </label>
                <label className="rbac-label">
                  Payment Mode
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.paymentMode}
                    onChange={(event) => setField("paymentMode", event.target.value)}
                  >
                    <option value="">Select payment mode</option>
                    {PAYMENT_MODE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label">
                  Status
                  <select
                    className="rbac-input rbac-select mb-2"
                    value={form.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option value="">Select status</option>
                    {LOADING_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rbac-label md:col-span-2">
                  Remark
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Remark"
                    value={form.remark}
                    onChange={(event) => setField("remark", event.target.value)}
                  />
                </label>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-4">
                    <p className="text-xs uppercase text-slate-500">Total Amount</p>
                    <p className="text-lg font-semibold">₹{currency(loadingVehicleTotal)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </fieldset>

          {note && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {note}
            </p>
          )}

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
            <Link href="/dashboard/transport-management">
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
