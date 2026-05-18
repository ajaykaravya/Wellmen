"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFilter,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import DashboardShell from "../../_components/DashboardShell";
import useDebounce from "@/app/hooks/useDebounce";
import AppliedFilterSummary from "../../../components/AppliedFilterSummary";
import ConfirmDialog from "../../../components/ConfirmDialog";
import CustomDatePicker from "../../../components/CustomDatePicker";
import ListingFilterDialog from "../../../components/ListingFilterDialog";
import {
  CNG_STATUS_OPTIONS,
  COURIER_STATUS_OPTIONS,
  LOADING_STATUS_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  PORTER_STATUS_OPTIONS,
  TRANSPORT_TYPES,
  formatTransportMoney,
  getTransportTypeShortLabel,
} from "@/lib/transport-management";
import { formatToDDMMYYYY } from "@/lib/dateUtils";

type TransportType = (typeof TRANSPORT_TYPES)[number]["key"];

type TransportRow = {
  id: string;
  serialNo: number;
  transportType: TransportType;
  transportTypeLabel: string;
  date: string;
  dcNumber: string | null;
  tripDescription: string | null;
  locationType: string | null;
  city: string | null;
  floor: string | null;
  kmStart: number;
  kmEnd: number;
  totalKm: number;
  loadType: string | null;
  driverWages: number;
  otherExpenses: number;
  floorRent: number;
  returnMaterialFreight: number;
  courierNumber: string | null;
  description: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  mobileNumber: string | null;
  noOfCovers: number;
  totalWeight: number;
  weightCharge: number;
  coverCharge: number;
  materialDescription: string | null;
  vehicleNumber: string | null;
  baseAmount: number;
  gstAmount: number;
  tripType: string | null;
  tripCharge: number;
  vehicleType: string | null;
  loadingCharges: number;
  returnMaterialCharges: number;
  transportCharges: number;
  paymentMode: string | null;
  status: string | null;
  remark: string | null;
  totalAmount: number;
  createdByName: string | null;
};

type DetailField = {
  label: string;
  value: string;
};

type DetailSection = {
  title: string;
  fields: DetailField[];
};

const allStatusOptions = Array.from(
  new Set([
    ...COURIER_STATUS_OPTIONS,
    ...PORTER_STATUS_OPTIONS,
    ...CNG_STATUS_OPTIONS,
    ...LOADING_STATUS_OPTIONS,
  ]),
);

const defaultTransportType = TRANSPORT_TYPES[0]?.key ?? "BOLERO_DELIVERY";

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatText = (value: string | null | undefined) =>
  value && String(value).trim() ? String(value) : "-";

const formatDate = (value: string) => (value ? formatToDDMMYYYY(value) : "-");

const formatStatus = (value: string | null | undefined) =>
  value && String(value).trim()
    ? String(value)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^./, (char) => char.toUpperCase())
    : "-";

const buildRowSummary = (row: TransportRow) => {
  switch (row.transportType) {
    case "BOLERO_DELIVERY":
    case "BOLERO_RETURN_DC":
      return [row.tripDescription, row.locationType, row.city, row.loadType]
        .map((item) => formatText(item))
        .join(" · ");
    case "COURIER_DAILY":
      return [
        row.description,
        row.fromLocation && row.toLocation
          ? `${row.fromLocation} -> ${row.toLocation}`
          : "",
        row.city,
      ]
        .filter(Boolean)
        .join(" · ");
    case "PORTER_DAILY":
      return [
        row.materialDescription,
        row.fromLocation && row.toLocation
          ? `${row.fromLocation} -> ${row.toLocation}`
          : "",
        row.city,
      ]
        .filter(Boolean)
        .join(" · ");
    case "CNG_RICKSHAW":
      return [
        row.dcNumber ? `DC ${row.dcNumber}` : "",
        row.tripType || "",
        row.fromLocation && row.toLocation
          ? `${row.fromLocation} -> ${row.toLocation}`
          : "",
        row.city,
      ]
        .filter(Boolean)
        .join(" · ");
    case "LOADING_VEHICLE":
      return [
        row.materialDescription,
        row.vehicleType,
        row.vehicleNumber ? `Vehicle ${row.vehicleNumber}` : "",
        row.fromLocation && row.toLocation
          ? `${row.fromLocation} -> ${row.toLocation}`
          : "",
        row.city,
      ]
        .filter(Boolean)
        .join(" · ");
    default:
      return row.city || "-";
  }
};

const getCommonDetails = (row: TransportRow): DetailSection => ({
  title: "Overview",
  fields: [
    { label: "Log No.", value: `#${row.serialNo}` },
    { label: "Transport Type", value: row.transportTypeLabel },
    { label: "Date", value: formatDate(row.date) },
    { label: "City", value: formatText(row.city) },
    { label: "Status", value: formatStatus(row.status) },
    { label: "Payment Mode", value: formatText(row.paymentMode) },
    { label: "Total Amount", value: `₹${formatMoney(row.totalAmount)}` },
    { label: "Created By", value: formatText(row.createdByName) },
    { label: "Remark", value: formatText(row.remark) },
  ],
});

const getTypeDetails = (row: TransportRow): DetailSection => {
  switch (row.transportType) {
    case "BOLERO_DELIVERY":
      return {
        title: "Trip Details",
        fields: [
          { label: "Trip Description", value: formatText(row.tripDescription) },
          { label: "Location Type", value: formatText(row.locationType) },
          { label: "Floor", value: formatText(row.floor) },
          { label: "Load Type", value: formatText(row.loadType) },
          { label: "KM Start", value: String(row.kmStart) },
          { label: "KM End", value: String(row.kmEnd) },
          { label: "Total KM", value: String(row.totalKm) },
          { label: "Driver Wages", value: `₹${formatMoney(row.driverWages)}` },
          { label: "Floor Rent", value: `₹${formatMoney(row.floorRent)}` },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    case "BOLERO_RETURN_DC":
      return {
        title: "Trip Details",
        fields: [
          { label: "Trip Description", value: formatText(row.tripDescription) },
          { label: "Location Type", value: formatText(row.locationType) },
          { label: "Floor", value: formatText(row.floor) },
          { label: "Load Type", value: formatText(row.loadType) },
          { label: "KM Start", value: String(row.kmStart) },
          { label: "KM End", value: String(row.kmEnd) },
          { label: "Total KM", value: String(row.totalKm) },
          { label: "Driver Wages", value: `₹${formatMoney(row.driverWages)}` },
          {
            label: "Return Material Freight",
            value: `₹${formatMoney(row.returnMaterialFreight)}`,
          },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    case "COURIER_DAILY":
      return {
        title: "Delivery Details",
        fields: [
          { label: "Courier Number", value: formatText(row.courierNumber) },
          { label: "Description", value: formatText(row.description) },
          { label: "From Location", value: formatText(row.fromLocation) },
          { label: "To Location", value: formatText(row.toLocation) },
          { label: "Mobile Number", value: formatText(row.mobileNumber) },
          { label: "No. of Covers", value: String(row.noOfCovers) },
          {
            label: "Total Weight",
            value: `${formatMoney(row.totalWeight)} KG`,
          },
          {
            label: "Weight Charge",
            value: `₹${formatMoney(row.weightCharge)}`,
          },
          { label: "Cover Charge", value: `₹${formatMoney(row.coverCharge)}` },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    case "PORTER_DAILY":
      return {
        title: "Delivery Details",
        fields: [
          {
            label: "Material Description",
            value: formatText(row.materialDescription),
          },
          { label: "From Location", value: formatText(row.fromLocation) },
          { label: "To Location", value: formatText(row.toLocation) },
          { label: "Base Amount", value: `₹${formatMoney(row.baseAmount)}` },
          { label: "GST Amount", value: `₹${formatMoney(row.gstAmount)}` },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    case "CNG_RICKSHAW":
      return {
        title: "Trip Details",
        fields: [
          { label: "DC Number", value: formatText(row.dcNumber) },
          { label: "Trip Type", value: formatText(row.tripType) },
          { label: "From Location", value: formatText(row.fromLocation) },
          { label: "To Location", value: formatText(row.toLocation) },
          { label: "Total KM", value: String(row.totalKm) },
          { label: "Trip Charge", value: `₹${formatMoney(row.tripCharge)}` },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    case "LOADING_VEHICLE":
      return {
        title: "Vehicle Details",
        fields: [
          {
            label: "Material Description",
            value: formatText(row.materialDescription),
          },
          { label: "Vehicle Type", value: formatText(row.vehicleType) },
          { label: "Vehicle Number", value: formatText(row.vehicleNumber) },
          { label: "From Location", value: formatText(row.fromLocation) },
          { label: "To Location", value: formatText(row.toLocation) },
          {
            label: "Loading Charges",
            value: `₹${formatMoney(row.loadingCharges)}`,
          },
          {
            label: "Return Material Charges",
            value: `₹${formatMoney(row.returnMaterialCharges)}`,
          },
          {
            label: "Transport Charges",
            value: `₹${formatMoney(row.transportCharges)}`,
          },
          {
            label: "Other Expenses",
            value: `₹${formatMoney(row.otherExpenses)}`,
          },
        ],
      };
    default:
      return {
        title: "Details",
        fields: [],
      };
  }
};

function TransportListView() {
  const [rows, setRows] = useState<TransportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [transportTypeFilter, setTransportTypeFilter] =
    useState<TransportType>(defaultTransportType);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("");
  const [draftPaymentModeFilter, setDraftPaymentModeFilter] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TransportRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<TransportRow | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const activeFilterCount = [
    query.trim(),
    statusFilter,
    paymentModeFilter,
    fromDate,
    toDate,
  ].filter(Boolean).length;

  const appliedFilters = [
    query.trim(),
    statusFilter,
    paymentModeFilter,
    fromDate,
    toDate,
  ].filter(Boolean);

  const openFilters = useCallback(() => {
    setDraftQuery(query);
    setDraftStatusFilter(statusFilter);
    setDraftPaymentModeFilter(paymentModeFilter);
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterOpen(true);
  }, [fromDate, paymentModeFilter, query, statusFilter, toDate]);

  const applyFilters = useCallback(() => {
    setPageIndex(0);
    setQuery(draftQuery);
    setStatusFilter(draftStatusFilter);
    setPaymentModeFilter(draftPaymentModeFilter);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setFilterOpen(false);
  }, [
    draftFromDate,
    draftPaymentModeFilter,
    draftQuery,
    draftStatusFilter,
    draftToDate,
  ]);

  const clearFilters = () => {
    setPageIndex(0);
    setQuery("");
    setStatusFilter("");
    setPaymentModeFilter("");
    setFromDate("");
    setToDate("");
  };

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
        transportType: transportTypeFilter,
      });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (paymentModeFilter) params.set("paymentMode", paymentModeFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(`/api/transport-management?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load transport logs.");
        return;
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load transport logs", error);
      toast.error("Failed to load transport logs.");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    fromDate,
    pageIndex,
    pageSize,
    paymentModeFilter,
    statusFilter,
    toDate,
    transportTypeFilter,
  ]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDelete = useCallback((row: TransportRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const getTransportTypeButtonClass = (type: TransportType) =>
    transportTypeFilter === type
      ? "rbac-button"
      : "rbac-button rbac-button-secondary";

  const handleView = useCallback(async (row: TransportRow) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);

    try {
      const res = await fetch(`/api/transport-management/${row.id}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load transport log details.");
        setViewOpen(false);
        return;
      }

      const data = await res.json();
      setViewData(data);
    } catch (error) {
      console.error("Failed to load transport log details", error);
      toast.error("Failed to load transport log details.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const closeView = useCallback(() => {
    setViewOpen(false);
    setViewData(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transport-management/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete transport log.");
        return;
      }
      await loadRows();
      toast.success("Transport log deleted successfully.");
    } catch (error) {
      console.error("Failed to delete transport log", error);
      toast.error("Failed to delete transport log.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadRows]);

  const columns = useMemo<ColumnDef<TransportRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        size: 160,
        cell: ({ row }) => (
            <div>
              {formatDate(row.original.date)}
            </div>
        ),
      },
      {
        header: "City",
        accessorKey: "city",
        size: 300,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Summary",
        id: "summary",
        size: 420,
        cell: ({ row }) => (
          <div className="max-w-[420px] whitespace-normal text-sm text-slate-700">
            {buildRowSummary(row.original)}
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 140,
        cell: ({ row }) =>
          row.original.status ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {formatStatus(row.original.status)}
            </span>
          ) : (
            "-"
          ),
      },
      {
        header: "Description",
        accessorKey: "tripDescription",
        size: 300,
        cell: (info) => (
          <span className="rbac-muted">{String(info.getValue() || "-")}</span>
        ),
      },
      {
        header: "Payment",
        accessorKey: "paymentMode",
        size: 140,
        cell: ({ row }) =>
          row.original.paymentMode ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {row.original.paymentMode}
            </span>
          ) : (
            "-"
          ),
      },
      {
        header: "Total",
        accessorKey: "totalAmount",
        size: 140,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            ₹{formatMoney(row.original.totalAmount)}
          </span>
        ),
      },
      {
        header: "Created By",
        accessorKey: "createdByName",
        size: 180,
        cell: ({ row }) => <span>{row.original.createdByName || "-"}</span>,
      },
      {
        header: "Action",
        id: "action",
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="rbac-link"
              type="button"
              onClick={() => handleView(row.original)}
              aria-label="View transport log"
            >
              <FaEye size={18} />
            </button>
            <Link href={`/dashboard/transport-management/${row.original.id}`}>
              <button
                className="rbac-link"
                type="button"
                aria-label="Edit transport log"
              >
                <FaEdit size={18} />
              </button>
            </Link>
            <button
              className="rbac-link danger"
              type="button"
              onClick={() => handleDelete(row.original)}
              aria-label="Delete transport log"
            >
              <FaTrash size={18} />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleView],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="rbac-title-lg">Transport Management</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter />
                <span>Filters</span>
              </button>
              <Link href="/dashboard/transport-management/new">
                <button className="rbac-button" type="button">
                  Add Log
                </button>
              </Link>
            </div>
          </div>

          <AppliedFilterSummary
            items={appliedFilters}
            onClear={clearFilters}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {TRANSPORT_TYPES.map((option) => (
              <button
                key={option.key}
                type="button"
                className={getTransportTypeButtonClass(option.key)}
                onClick={() => {
                  setPageIndex(0);
                  setTransportTypeFilter(option.key);
                }}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No transport logs found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className="px-4 py-3 text-sm border-b border-slate-100"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              <div className="space-y-3">
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <FaSpinner className="animate-spin mr-2" size={16} />
                  </div>
                )}
                {!loading && rows.length === 0 && (
                  <div className="rbac-card py-4 text-sm text-slate-500">
                    No transport logs found.
                  </div>
                )}
                {!loading &&
                  rows.map((row) => (
                    <div key={row.id} className="rbac-card p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-[#2596be] px-3 py-1 text-xs font-medium text-white">
                              #{row.serialNo}
                            </span>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {getTransportTypeShortLabel(row.transportType)}
                            </span>
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                              ₹{formatMoney(row.totalAmount)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">
                              {formatDate(row.date)}
                            </p>
                            <p className="text-slate-500">{row.city || "-"}</p>
                            <p className="mt-1">{buildRowSummary(row)}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                Status: {formatStatus(row.status)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                                Payment: {formatText(row.paymentMode)}
                              </span>
                            </div>
                            {row.createdByName && (
                              <p className="mt-2 text-xs text-slate-500">
                                By {row.createdByName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <button
                            className="rbac-link"
                            type="button"
                            onClick={() => handleView(row)}
                            title="View"
                            aria-label="View transport log"
                          >
                            <FaEye size={18} />
                          </button>
                          <Link
                            href={`/dashboard/transport-management/${row.id}`}
                          >
                            <button
                              className="rbac-link"
                              type="button"
                              title="Edit"
                            >
                              <FaEdit size={18} />
                            </button>
                          </Link>
                          <button
                            className="rbac-link danger"
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(row)}
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    className="change-button change-button-secondary"
                    type="button"
                    onClick={() =>
                      setPageIndex((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={pageIndex === 0}
                  >
                    <FaChevronLeft size={20} />
                  </button>
                  <span>
                    Page {pageIndex + 1} of {pageCount}
                  </span>
                  <button
                    className="change-button change-button-secondary"
                    type="button"
                    onClick={() =>
                      setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                    }
                    disabled={pageIndex + 1 >= pageCount}
                  >
                    <FaChevronRight size={20} />
                  </button>
                </div>
                <div>
                  <select
                    className="rbac-input rbac-select rbac-pagination"
                    value={pageSize}
                    onChange={(event) => {
                      setPageIndex(0);
                      setPageSize(Number(event.target.value));
                    }}
                  >
                    {[5, 10, 20, 30].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ListingFilterDialog
        open={filterOpen}
        title="Filter transport logs"
        description="Narrow logs by status, payment mode, or date range."
        activeCount={activeFilterCount}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilters}
      >
        <label className="rbac-label">
          Search
          <input
            className="rbac-input"
            placeholder="Search by DC number, city, vehicle, remark..."
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </label>
        <label className="rbac-label">
          Status
          <select
            className="rbac-input rbac-select"
            value={draftStatusFilter}
            onChange={(event) => setDraftStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {allStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="rbac-label">
          Payment Mode
          <select
            className="rbac-input rbac-select"
            value={draftPaymentModeFilter}
            onChange={(event) => setDraftPaymentModeFilter(event.target.value)}
          >
            <option value="">All payment modes</option>
            {PAYMENT_MODE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="rbac-label">
            From Date
            <CustomDatePicker
              value={draftFromDate}
              onChange={setDraftFromDate}
              placeholder="DD/MM/YYYY"
              className="rbac-input"
            />
          </label>
          <label className="rbac-label">
            To Date
            <CustomDatePicker
              value={draftToDate}
              onChange={setDraftToDate}
              placeholder="DD/MM/YYYY"
              className="rbac-input"
            />
          </label>
        </div>
      </ListingFilterDialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete transport log?"
        description={`This will permanently delete ${
          confirmTarget
            ? `${getTransportTypeShortLabel(confirmTarget.transportType)} #${
                confirmTarget.serialNo
              }`
            : "the selected log"
        }.`}
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />

      <Dialog open={viewOpen} onClose={closeView} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto px-4 py-6">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="theme-modal-surface w-full max-w-4xl rounded-2xl p-4 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg font-semibold theme-text">
                    Transport Log Details
                  </DialogTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Full record for the selected transport log.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={closeView}
                  aria-label="Close details"
                >
                  <IoIosClose size={24} />
                </button>
              </div>

              {viewLoading && (
                <div className="flex items-center justify-center py-10">
                  <FaSpinner className="animate-spin mr-2" size={16} />
                </div>
              )}

              {!viewLoading && viewData && (
                <div className="mt-5 space-y-4">
                  {[getCommonDetails(viewData), getTypeDetails(viewData)].map(
                    (section) => (
                      <div
                        key={section.title}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {section.title}
                        </h4>
                        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                          {section.fields.map((field) => (
                            <div
                              key={field.label}
                              className="rounded-lg bg-slate-50 p-3"
                            >
                              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                {field.label}
                              </dt>
                              <dd className="mt-1 text-sm font-medium text-slate-900">
                                {field.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ),
                  )}
                </div>
              )}

              {!viewLoading && !viewData && (
                <div className="py-10 text-sm text-slate-500">
                  No transport log selected.
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function TransportListContent() {
  return (
    <DashboardShell>
      <TransportListView />
    </DashboardShell>
  );
}
