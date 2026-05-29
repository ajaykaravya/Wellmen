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
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  LOADING_VEHICLE_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  TRIP_TYPE_OPTIONS,
  TRANSPORT_TYPES,
  findCngTripConfig,
  findCourierRateConfig,
  findDriverWageConfig,
  findFloorRentConfig,
  getCngTripCharge,
  getCourierChargesWithConfigs,
  getDriverWages,
  getFloorRent,
  getLoadingVehicleTotal,
  getPorterCharges,
  getTransportReferenceLabel,
  getTransportTypeLabel,
  LOADING_STATUS_OPTIONS,
  PORTER_STATUS_OPTIONS,
  COURIER_STATUS_OPTIONS,
} from "@/lib/transport-management";
import type { FloorRentConfig } from "@/lib/transport-management";
import { formatToDDMMYYYY, getTodayInputDate } from "@/lib/dateUtils";

type TransportType = (typeof TRANSPORT_TYPES)[number]["key"];

type TransportFormState = {
  transportType: TransportType;
  date: string;
  referenceNumber: string;
  description: string;
  locationType: string;
  city: string;
  floor: string;
  kmStart: string;
  kmEnd: string;
  totalKm: string;
  loadType: string;
  otherExpenses: string;
  fromLocation: string;
  toLocation: string;
  mobileNumber: string;
  noOfCovers: string;
  totalWeight: string;
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
  referenceNumber: "",
  description: "",
  locationType: "",
  city: "",
  floor: "",
  kmStart: "",
  kmEnd: "",
  totalKm: "",
  loadType: "",
  otherExpenses: "",
  fromLocation: "",
  toLocation: "",
  mobileNumber: "",
  noOfCovers: "",
  totalWeight: "",
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
    const raw = (searchParams?.get("type") || "").toUpperCase();
    return TRANSPORT_TYPES.some((option) => option.key === raw)
      ? (raw as TransportType)
      : "BOLERO_DELIVERY";
  }, [searchParams]);
  const [form, setForm] = useState<TransportFormState>(emptyForm(initialType));
  const [loading, setLoading] = useState(true);
  const [transportConfigs, setTransportConfigs] = useState<FloorRentConfig[]>(
    [],
  );
  const [transportConfigLoaded, setTransportConfigLoaded] = useState(false);
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
        setForm({
          transportType: data.transportType || "BOLERO_DELIVERY",
          date:
            formatToDDMMYYYY(data.date) === "-"
              ? getTodayInputDate()
              : formatToDDMMYYYY(data.date),
          referenceNumber: data.referenceNumber || "",
          description: data.description || "",
          locationType: data.locationType || "",
          city: data.city || "",
          floor: data.floor || "",
          kmStart: String(data.kmStart ?? ""),
          kmEnd: String(data.kmEnd ?? ""),
          totalKm: String(data.totalKm ?? ""),
          loadType: data.loadType || "",
          otherExpenses: String(data.otherExpenses ?? ""),
          fromLocation: data.fromLocation || "",
          toLocation: data.toLocation || "",
          mobileNumber: data.mobileNumber || "",
          noOfCovers: String(data.noOfCovers ?? ""),
          totalWeight: String(data.totalWeight ?? ""),
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

  useEffect(() => {
    let cancelled = false;

    const loadTransportConfigs = async () => {
      const transportConfigTypes =
        form.transportType === "BOLERO_DELIVERY" ||
          form.transportType === "BOLERO_RETURN_DC"
          ? ["DRIVER_WAGE_SLAB", "FLOOR_RENT"]
          : form.transportType === "COURIER_DAILY"
            ? ["COURIER_WEIGHT_RATE", "COURIER_COVER_RATE"]
            : form.transportType === "CNG_RICKSHAW"
              ? ["CNG_TRIP_SLAB"]
              : [];

      if (!transportConfigTypes.length) {
        setTransportConfigs([]);
        setTransportConfigLoaded(true);
        return;
      }

      setTransportConfigLoaded(false);

      try {
        const res = await fetch(
          `/api/transport-configs?transportType=${form.transportType}`,
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          if (!cancelled) {
            setNote(payload.error || "Failed to load transport configs.");
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setTransportConfigs(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (error) {
        console.error("Failed to load transport configs", error);
        if (!cancelled) {
          setNote("Failed to load transport configs.");
        }
      } finally {
        if (!cancelled) setTransportConfigLoaded(true);
      }
    };

    loadTransportConfigs();

    return () => {
      cancelled = true;
    };
  }, [form.transportType]);

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

  const renderFieldError = (field: keyof TransportFormState) =>
    errors[field] ? (
      <p className="text-sm text-red-600 mb-2">{errors[field]}</p>
    ) : null;

  const boleroTotalKm = useMemo(
    () => Math.max(0, numberOrZero(form.kmEnd) - numberOrZero(form.kmStart)),
    [form.kmEnd, form.kmStart],
  );

  const boleroDriverWages = useMemo(
    () => getDriverWages(boleroTotalKm, transportConfigs, form.transportType),
    [boleroTotalKm, form.transportType, transportConfigs],
  );

  const boleroFloorRent = useMemo(
    () =>
      getFloorRent(
        form.transportType,
        form.floor,
        form.loadType,
        transportConfigs,
      ),
    [form.floor, form.loadType, form.transportType, transportConfigs],
  );

  const boleroFloorRentWarning = useMemo(() => {
    if (
      form.transportType !== "BOLERO_DELIVERY" &&
      form.transportType !== "BOLERO_RETURN_DC"
    )
      return null;
    if (!form.floor || !form.loadType) return null;
    if (!transportConfigLoaded) return null;

    const config = findFloorRentConfig(
      transportConfigs,
      form.transportType,
      form.floor,
      form.loadType,
    );

    return config
      ? null
      : "No transport config found for this floor and load type. Rate is calculated as 0.";
  }, [
    transportConfigLoaded,
    transportConfigs,
    form.floor,
    form.loadType,
    form.transportType,
  ]);

  const driverWageWarning = useMemo(() => {
    if (
      form.transportType !== "BOLERO_DELIVERY" &&
      form.transportType !== "BOLERO_RETURN_DC"
    )
      return null;
    if (!transportConfigLoaded) return null;
    const config = findDriverWageConfig(
      transportConfigs,
      form.transportType,
      boleroTotalKm,
    );
    return config ? null : "No driver wage slab found. Rate is calculated as 0.";
  }, [
    boleroTotalKm,
    form.transportType,
    transportConfigLoaded,
    transportConfigs,
  ]);

  const courierWarning = useMemo(() => {
    if (form.transportType !== "COURIER_DAILY") return null;
    if (!transportConfigLoaded) return null;
    const weightRate = findCourierRateConfig(
      transportConfigs,
      form.transportType,
      "COURIER_WEIGHT_RATE",
    );
    const coverRate = findCourierRateConfig(
      transportConfigs,
      form.transportType,
      "COURIER_COVER_RATE",
    );
    return weightRate && coverRate
      ? null
      : "Courier config is missing. Charges are calculated as 0.";
  }, [form.transportType, transportConfigLoaded, transportConfigs]);

  const cngWarning = useMemo(() => {
    if (form.transportType !== "CNG_RICKSHAW") return null;
    if (!form.tripType || !form.totalKm) return null;
    if (!transportConfigLoaded) return null;
    const config = findCngTripConfig(
      transportConfigs,
      form.tripType,
      numberOrZero(form.totalKm),
    );
    return config ? null : "No CNG trip slab found. Rate is calculated as 0.";
  }, [
    form.totalKm,
    form.tripType,
    form.transportType,
    transportConfigLoaded,
    transportConfigs,
  ]);

  const courierCharges = useMemo(
    () =>
      getCourierChargesWithConfigs(
        numberOrZero(form.totalWeight),
        numberOrZero(form.noOfCovers),
        transportConfigs,
      ),
    [form.noOfCovers, form.totalWeight, transportConfigs],
  );

  const porterCharges = useMemo(
    () => getPorterCharges(numberOrZero(form.baseAmount), numberOrZero(form.otherExpenses)),
    [form.baseAmount, form.otherExpenses],
  );

  const cngTripCharge = useMemo(
    () =>
      getCngTripCharge(
        numberOrZero(form.totalKm),
        form.tripType || null,
        transportConfigs,
      ),
    [form.totalKm, form.tripType, transportConfigs],
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

  const totalAmount = useMemo(() => {
    switch (form.transportType) {
      case "BOLERO_DELIVERY":
      case "BOLERO_RETURN_DC":
        return boleroDriverWages + boleroFloorRent + numberOrZero(form.otherExpenses);
      case "COURIER_DAILY":
        return courierCharges.totalAmount + numberOrZero(form.otherExpenses);
      case "PORTER_DAILY":
        return porterCharges.totalAmount;
      case "CNG_RICKSHAW":
        return cngTripCharge + numberOrZero(form.otherExpenses);
      case "LOADING_VEHICLE":
        return loadingVehicleTotal;
      default:
        return numberOrZero(form.otherExpenses);
    }
  }, [
    boleroDriverWages,
    boleroFloorRent,
    cngTripCharge,
    courierCharges.totalAmount,
    form.otherExpenses,
    form.transportType,
    loadingVehicleTotal,
    porterCharges.totalAmount,
  ]);

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
        if (!form.locationType.trim())
          nextErrors.locationType = "Location type is required.";
        if (!form.fromLocation.trim())
          nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim())
          nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.floor.trim()) nextErrors.floor = "Floor is required.";
        if (!form.kmStart.trim()) nextErrors.kmStart = "KM start is required.";
        if (!form.kmEnd.trim()) nextErrors.kmEnd = "KM end is required.";
        if (!form.loadType.trim())
          nextErrors.loadType = "Load type is required.";
        break;
      case "COURIER_DAILY":
        if (!form.fromLocation.trim())
          nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim())
          nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.noOfCovers.trim())
          nextErrors.noOfCovers = "No. of covers is required.";
        if (!form.totalWeight.trim())
          nextErrors.totalWeight = "Total weight is required.";
        break;
      case "PORTER_DAILY":
        if (!form.fromLocation.trim())
          nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim())
          nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.baseAmount.trim())
          nextErrors.baseAmount = "Base amount is required.";
        if (!form.mobileNumber.trim())
          nextErrors.mobileNumber = "Mobile number is required.";
        if (!form.vehicleNumber.trim())
          nextErrors.vehicleNumber = "Vehicle number is required.";
        if (!form.status.trim()) nextErrors.status = "Status is required.";
        break;
      case "CNG_RICKSHAW":
        if (!form.tripType.trim())
          nextErrors.tripType = "Trip type is required.";
        if (!form.fromLocation.trim())
          nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim())
          nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City/route is required.";
        if (!form.mobileNumber.trim())
          nextErrors.mobileNumber = "Mobile number is required.";
        if (!form.vehicleNumber.trim())
          nextErrors.vehicleNumber = "Vehicle number is required.";
        if (!form.totalKm.trim()) nextErrors.totalKm = "Total KM is required.";
        if (!form.status.trim()) nextErrors.status = "Status is required.";
        break;
      case "LOADING_VEHICLE":
        if (!form.vehicleType.trim())
          nextErrors.vehicleType = "Vehicle type is required.";
        if (!form.fromLocation.trim())
          nextErrors.fromLocation = "From location is required.";
        if (!form.toLocation.trim())
          nextErrors.toLocation = "To location is required.";
        if (!form.city.trim()) nextErrors.city = "City/route is required.";
        if (!form.mobileNumber.trim())
          nextErrors.mobileNumber = "Mobile number is required.";
        if (!form.vehicleNumber.trim())
          nextErrors.vehicleNumber = "Vehicle number is required.";
        if (!form.status.trim()) nextErrors.status = "Status is required.";
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
      referenceNumber: form.referenceNumber,
      description: form.description,
      locationType: form.locationType,
      city: form.city,
      floor: form.floor,
      kmStart: form.kmStart,
      kmEnd: form.kmEnd,
      totalKm: form.totalKm,
      loadType: form.loadType,
      otherExpenses: form.otherExpenses,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      mobileNumber: form.mobileNumber,
      noOfCovers: form.noOfCovers,
      totalWeight: form.totalWeight,
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

  const getStatusOptions = (
    transportType?: TransportType,
  ): readonly string[] => {
    switch (transportType) {
      case "COURIER_DAILY":
        return COURIER_STATUS_OPTIONS;

      case "PORTER_DAILY":
        return PORTER_STATUS_OPTIONS;

      case "CNG_RICKSHAW":
        return CNG_STATUS_OPTIONS;

      case "LOADING_VEHICLE":
        return LOADING_STATUS_OPTIONS;

      default:
        return [];
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (!validate()) return;

    try {
      setSaving(true);
      const res = await fetch(
        transportId
          ? `/api/transport-management/${transportId}`
          : "/api/transport-management",
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
      router.push(
        `/dashboard/transport-management?type=${form.transportType}`,
      );
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
          <h3 className="rbac-title-lg">
            {transportId
              ? `Edit ${selectedTypeLabel}`
              : `Add ${selectedTypeLabel}`}
          </h3>
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
            {renderFieldError("transportType")}

            <div className="grid gap-2 md:gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Date <span className="text-red-600">*</span>
                <CustomDatePicker
                  value={form.date}
                  onChange={(value) => setField("date", value)}
                  placeholder="DD/MM/YYYY"
                  className="rbac-input"
                />
              </label>
              {renderFieldError("date")}
              <label className="rbac-label">
                {getTransportReferenceLabel(form.transportType)}
                <input
                  className="rbac-input mb-2"
                  placeholder={
                    form.transportType === "COURIER_DAILY"
                      ? "Courier number"
                      : "DC number"
                  }
                  value={form.referenceNumber}
                  onChange={(event) =>
                    setField("referenceNumber", event.target.value)
                  }
                />
              </label>
            </div>
            <label className="rbac-label md:col-span-2 mt-2">
              Description
              <textarea
                className="rbac-input"
                rows={3}
                placeholder="Description"
                value={form.description}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
              />
            </label>
            {form.transportType === "BOLERO_DELIVERY" ||
              form.transportType === "BOLERO_RETURN_DC" ? (
              <div>
                <ButtonGroup
                  title="Location Type"
                  selected={form.locationType || null}
                  options={LOCATION_TYPE_OPTIONS.map((option) => ({
                    key: option,
                    label: option,
                  }))}
                  onSelect={(value) => setField("locationType", value)}
                  required
                  error={errors.locationType}
                />
              </div>
            ) : null}
            <div className="grid gap-2 md:gap-4 md:grid-cols-4">
              <div>
                <label className="rbac-label">
                  From Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input"
                    placeholder="Pickup location"
                    value={form.fromLocation}
                    onChange={(event) =>
                      setField("fromLocation", event.target.value)
                    }
                  />
                </label>
                {renderFieldError("fromLocation")}
              </div>
              <div>
                <label className="rbac-label">
                  To Location <span className="text-red-600">*</span>
                  <input
                    className="rbac-input"
                    placeholder="Delivery location"
                    value={form.toLocation}
                    onChange={(event) =>
                      setField("toLocation", event.target.value)
                    }
                  />
                </label>
                {renderFieldError("toLocation")}
              </div>
              <div>
                <label className="rbac-label">
                  City <span className="text-red-600">*</span>
                  <input
                    className="rbac-input mb-2"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                  />
                </label>
                {renderFieldError("city")}
              </div>
            </div>
            {form.transportType === "BOLERO_DELIVERY" ||
              form.transportType === "BOLERO_RETURN_DC" ? (
              <div>
                <ButtonGroup
                  title="Load Type"
                  selected={form.loadType || null}
                  options={LOAD_TYPE_OPTIONS.map((option) => ({
                    key: option,
                    label: option,
                  }))}
                  onSelect={(value) => setField("loadType", value)}
                  required
                  error={errors.loadType}
                />
                <div className="grid gap-1 mt-2 md:gap-4 md:grid-cols-4">
                  <div>
                    <label className="rbac-label">
                      KM Start <span className="text-red-600">*</span>
                      <input
                        className="rbac-input"
                        type="number"
                        step="1"
                        min="0"
                        value={form.kmStart}
                        onWheel={(event) => event.currentTarget.blur()}
                        onChange={(event) =>
                          setField("kmStart", event.target.value)
                        }
                      />
                    </label>
                    {renderFieldError("kmStart")}
                  </div>
                  <div>
                    <label className="rbac-label">
                      KM End <span className="text-red-600">*</span>
                      <input
                        className="rbac-input"
                        type="number"
                        step="1"
                        min="0"
                        value={form.kmEnd}
                        onWheel={(event) => event.currentTarget.blur()}
                        onChange={(event) =>
                          setField("kmEnd", event.target.value)
                        }
                      />
                    </label>
                    {renderFieldError("kmEnd")}
                  </div>
                  <label className="rbac-label mt-2">
                    Total KM
                    <input
                      className="rbac-input"
                      type="text"
                      value={boleroTotalKm}
                      readOnly
                      aria-readonly="true"
                    />
                  </label>
                  <label className="rbac-label mt-2">
                    Driver Wages
                    <input
                      className="rbac-input"
                      type="text"
                      value={`₹${currency(boleroDriverWages)}`}
                      readOnly
                      aria-readonly="true"
                    />
                    {driverWageWarning && (
                      <p className="mt-2 text-xs text-red-600">
                        {driverWageWarning}
                      </p>
                    )}
                  </label>
                </div>
                <div className="grid gap-2 mt-2 md:gap-4 md:grid-cols-2">
                  <div>
                    <label className="rbac-label">
                      Floor <span className="text-red-600">*</span>
                      <select
                        className="rbac-input rbac-select"
                        value={form.floor}
                        onChange={(event) =>
                          setField("floor", event.target.value)
                        }
                      >
                        <option value="">Select floor</option>
                        {FLOOR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {renderFieldError("floor")}
                  </div>
                  <label className="rbac-label">
                    {form.transportType === "BOLERO_RETURN_DC"
                      ? "Return Material Freight"
                      : "Floor Rent"}
                    <input
                      className="rbac-input"
                      type="text"
                      value={`₹${currency(boleroFloorRent)}`}
                      readOnly
                      aria-readonly="true"
                    />
                    {boleroFloorRentWarning && (
                      <p className="mt-2 text-xs text-red-600">
                        {boleroFloorRentWarning}
                      </p>
                    )}
                  </label>
                </div>
              </div>
            ) : null}

            {form.transportType === "COURIER_DAILY" || form.transportType === "PORTER_DAILY" || form.transportType === "CNG_RICKSHAW" || form.transportType === "LOADING_VEHICLE" ? (
              <div className="grid gap-2 md:gap-4 md:grid-cols-2 mt-2">
                <div>
                  <label className="rbac-label">
                    Mobile Number <span className="text-red-600">*</span>
                    <input
                      className="rbac-input"
                      placeholder="Mobile number"
                      value={form.mobileNumber}
                      maxLength={10}
                      onChange={(event) => {
                        const onlyNumbers = event.target.value.replace(
                          /\D/g,
                          "",
                        );
                        setField("mobileNumber", onlyNumbers);
                      }}
                    />
                    {renderFieldError("mobileNumber")}
                  </label>
                </div>
                <div>
                  <label className="rbac-label">
                    Vehicle Number <span className="text-red-600">*</span>
                    <input
                      className="rbac-input"
                      placeholder="Vehicle number"
                      value={form.vehicleNumber}
                      onChange={(event) =>
                        setField("vehicleNumber", event.target.value)
                      }
                    />
                    {renderFieldError("vehicleNumber")}
                  </label>
                </div>
              </div>

            ) : null}

            {form.transportType === "COURIER_DAILY" ? (
              <div className="grid gap-2 md:gap-4 md:grid-cols-2 mt-2">
                <div>
                  <label className="rbac-label">
                    No. of Covers <span className="text-red-600">*</span>
                    <input
                      className="rbac-input"
                      type="number"
                      step="1"
                      min="0"
                      value={form.noOfCovers}
                      onChange={(event) =>
                        setField("noOfCovers", event.target.value)
                      }
                    />
                  </label>
                  {renderFieldError("noOfCovers")}
                </div>
                <label className="rbac-label">
                  Cover Charge
                  <input
                    className="rbac-input"
                    type="text"
                    value={`₹${currency(courierCharges.coverCharge)}`}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
                {courierWarning && (
                  <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                    {courierWarning}
                  </div>
                )}
                <div>
                  <label className="rbac-label">
                    Total Weight (KG) <span className="text-red-600">*</span>
                    <input
                      className="rbac-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.totalWeight}
                      onWheel={(event) => event.currentTarget.blur()}
                      onChange={(event) =>
                        setField("totalWeight", event.target.value)
                      }
                    />
                  </label>
                  {renderFieldError("totalWeight")}
                </div>
                <label className="rbac-label">
                  Weight Charge
                  <input
                    className="rbac-input"
                    type="text"
                    value={`₹${currency(courierCharges.weightCharge)}`}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
              </div>
            ) : null}

            {form.transportType === "PORTER_DAILY" ? (
              <div className="grid gap-2 md:gap-4 md:grid-cols-4 mt-2">
                <div>
                  <label className="rbac-label">
                    Base Amount <span className="text-red-600">*</span>
                    <input
                      className="rbac-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.baseAmount}
                      onWheel={(event) => event.currentTarget.blur()}
                      onChange={(event) =>
                        setField("baseAmount", event.target.value)
                      }
                    />
                  </label>
                  {renderFieldError("baseAmount")}
                </div>
                <label className="rbac-label">
                  GST
                  <input
                    className="rbac-input"
                    type="text"
                    value={`₹${currency(porterCharges.gstAmount)}`}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
              </div>
            ) : null}

            {form.transportType === "CNG_RICKSHAW" ? (
              <div className="mt-2">
                <div>
                  <ButtonGroup
                    title="Trip Type"
                    selected={form.tripType || null}
                    options={TRIP_TYPE_OPTIONS.map((option) => ({
                      key: option,
                      label: option,
                    }))}
                    onSelect={(value) => setField("tripType", value)}
                    required
                    error={errors.tripType}
                  />
                  {renderFieldError("tripType")}
                </div>
                <div className="grid gap-2 md:gap-4 md:grid-cols-2 mt-2">
                  <div>
                    <label className="rbac-label">
                      Total KM <span className="text-red-600">*</span>
                      <input
                        className="rbac-input"
                        type="number"
                        step="1"
                        min="0"
                        value={form.totalKm}
                        onWheel={(event) => event.currentTarget.blur()}
                        onChange={(event) =>
                          setField("totalKm", event.target.value)
                        }
                      />
                    </label>
                    {renderFieldError("totalKm")}
                  </div>

                  <label className="rbac-label">
                    Trip Charge
                    <input
                      className="rbac-input"
                      type="text"
                      value={`₹${currency(cngTripCharge)}`}
                      readOnly
                      aria-readonly="true"
                    />
                    {cngWarning && (
                      <p className="mt-2 text-xs text-red-600">{cngWarning}</p>
                    )}
                  </label>
                </div>
              </div>
            ) : null}

            {form.transportType === "LOADING_VEHICLE" ? (
              <div className="mt-2">
                <div>
                  <ButtonGroup
                    title="Vehicle Type"
                    selected={form.vehicleType || null}
                    options={LOADING_VEHICLE_TYPE_OPTIONS.map((option) => ({
                      key: option,
                      label: option,
                    }))}
                    onSelect={(value) => setField("vehicleType", value)}
                    required
                    error={errors.vehicleType}
                  />
                  {renderFieldError("vehicleType")}
                </div>
                <div className="grid gap-2 md:gap-4 md:grid-cols-4 mt-2">
                  <label className="rbac-label">
                    Loading Charges
                    <input
                      className="rbac-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.loadingCharges}
                      onWheel={(event) => event.currentTarget.blur()}
                      onChange={(event) =>
                        setField("loadingCharges", event.target.value)
                      }
                    />
                  </label>
                  <label className="rbac-label">
                    Return Material Charges
                    <input
                      className="rbac-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.returnMaterialCharges}
                      onWheel={(event) => event.currentTarget.blur()}
                      onChange={(event) =>
                        setField("returnMaterialCharges", event.target.value)
                      }
                    />
                  </label>
                  <label className="rbac-label">
                    Transport Charges
                    <input
                      className="rbac-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.transportCharges}
                      onWheel={(event) => event.currentTarget.blur()}
                      onChange={(event) =>
                        setField("transportCharges", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 mt-2 md:gap-4 md:grid-cols-2">
              <label className="rbac-label">
                Other Expenses
                <input
                  className="rbac-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.otherExpenses}
                  onWheel={(event) => event.currentTarget.blur()}
                  onChange={(event) =>
                    setField("otherExpenses", event.target.value)
                  }
                />
              </label>
              <label className="rbac-label">
                Total Amount
                <input
                  className="rbac-input"
                  type="text"
                  value={`₹${currency(totalAmount)}`}
                  readOnly
                  aria-readonly="true"
                />
              </label>
            </div>
            {form.transportType === "PORTER_DAILY" ||
              form.transportType === "CNG_RICKSHAW" ||
              form.transportType === "COURIER_DAILY" ||
              form.transportType === "LOADING_VEHICLE" ? (
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2 my-2">
                <div className="col-start-1 col-end-3">
                  <label className="rbac-label" style={{ display: 'flex', flexDirection: "column", width: "50%" }}>
                    Payment Mode
                    <select
                      className="rbac-input rbac-select"
                      value={form.paymentMode}
                      onChange={(event) =>
                        setField("paymentMode", event.target.value)
                      }
                    >
                      <option value="">Select payment mode</option>
                      {PAYMENT_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  {renderFieldError("paymentMode")}
                </div>
                <div>
                  <ButtonGroup
                    title="Status"
                    selected={form.status || null}
                    options={getStatusOptions(form.transportType).map((option) => ({
                      key: option,
                      label: option,
                    }))}
                    required
                    onSelect={(value) => setField("status", value)}
                    error={errors.status}
                  />
                </div>
              </div>
            ) : null}

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
              href={`/dashboard/transport-management?type=${form.transportType}`}
            >
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
