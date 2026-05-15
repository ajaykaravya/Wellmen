"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import CustomDatePicker from "../../../../components/CustomDatePicker";
import DashboardShell from "../../../_components/DashboardShell";
import useDebounce from "@/app/hooks/useDebounce";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import {
  FLOOR_OPTIONS,
  LOAD_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
} from "@/lib/boleroDeliveryLog";

type BoleroDeliveryLogRow = {
  id: string;
  tripDate: string;
  tripDescription: string;
  locationType: string;
  city: string | null;
  floor: string;
  kmStart: number;
  kmEnd: number;
  totalKm: number;
  loadType: string;
  driverWages: number;
  otherExpenses: number;
  floorRent: number;
  totalAmount: number;
  dcNumber: string | null;
  remark: string | null;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function BoleroDeliveryLogListContent() {
  const [rows, setRows] = useState<BoleroDeliveryLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [loadTypeFilter, setLoadTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<BoleroDeliveryLogRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (locationTypeFilter) params.set("locationType", locationTypeFilter);
      if (floorFilter) params.set("floor", floorFilter);
      if (loadTypeFilter) params.set("loadType", loadTypeFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const res = await fetch(
        `/api/transport-management/bolero-delivery-log?${params.toString()}`,
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load bolero delivery logs.");
        return;
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load bolero delivery logs", error);
      toast.error("Failed to load bolero delivery logs.");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    floorFilter,
    fromDate,
    loadTypeFilter,
    locationTypeFilter,
    pageIndex,
    pageSize,
    toDate,
  ]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const handleDelete = useCallback((row: BoleroDeliveryLogRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/transport-management/bolero-delivery-log/${confirmTarget.id}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete bolero delivery log.");
        return;
      }

      await loadLogs();
      toast.success("Bolero delivery log deleted successfully.");
    } catch (error) {
      console.error("Failed to delete bolero delivery log", error);
      toast.error("Failed to delete bolero delivery log.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadLogs]);

  const clearFilters = () => {
    setPageIndex(0);
    setQuery("");
    setLocationTypeFilter("");
    setFloorFilter("");
    setLoadTypeFilter("");
    setFromDate("");
    setToDate("");
  };

  return (
    <DashboardShell requireAdmin>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="rbac-title-lg">Bolero Delivery Log</h3>
              <p className="text-sm text-slate-500">
                Trip log entries with auto-calculated KM, wages, floor rent and
                total amount.
              </p>
            </div>
            <Link href="/dashboard/transport-management/bolero-delivery-log/new">
              <button className="rbac-button" type="button">
                Add Log
              </button>
            </Link>
          </div>

          <div className="my-4 grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-6">
            <input
              className="rbac-input-filter"
              type="text"
              placeholder="Search trip, city, DC, remark"
              value={query}
              onChange={(event) => {
                setPageIndex(0);
                setQuery(event.target.value);
              }}
            />
            <select
              className="rbac-input-filter"
              value={locationTypeFilter}
              onChange={(event) => {
                setPageIndex(0);
                setLocationTypeFilter(event.target.value);
              }}
            >
              <option value="">All location types</option>
              {LOCATION_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="rbac-input-filter"
              value={floorFilter}
              onChange={(event) => {
                setPageIndex(0);
                setFloorFilter(event.target.value);
              }}
            >
              <option value="">All floors</option>
              {FLOOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="rbac-input-filter"
              value={loadTypeFilter}
              onChange={(event) => {
                setPageIndex(0);
                setLoadTypeFilter(event.target.value);
              }}
            >
              <option value="">All load types</option>
              {LOAD_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <CustomDatePicker
              value={fromDate}
              onChange={(value) => {
                setPageIndex(0);
                setFromDate(value);
              }}
              placeholder="From date"
              className="rbac-input-filter"
            />
            <CustomDatePicker
              value={toDate}
              onChange={(value) => {
                setPageIndex(0);
                setToDate(value);
              }}
              placeholder="To date"
              className="rbac-input-filter"
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              className="rbac-button rbac-button-secondary"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
            <div className="ml-auto text-sm text-slate-500 flex items-center">
              Total records: {total}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Sr No
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Trip Description
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Location Type
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    City
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Floor
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    KM Start
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    KM End
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Total KM
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Load Type
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Driver Wages
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Other Expenses
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Floor Rent
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Total Amount
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    DC Number
                  </th>
                  <th className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Remark
                  </th>
                  <th className="text-right text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center" colSpan={17}>
                      <span className="inline-flex items-center gap-2 text-slate-500">
                        <FaSpinner className="animate-spin" />
                        Loading...
                      </span>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={17}>
                      No bolero delivery logs found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{pageIndex * pageSize + index + 1}</td>
                      <td className="px-4 py-3">{formatToDDMMYYYY(row.tripDate)}</td>
                      <td className="px-4 py-3">{row.tripDescription}</td>
                      <td className="px-4 py-3">{row.locationType}</td>
                      <td className="px-4 py-3">{row.city || "-"}</td>
                      <td className="px-4 py-3">{row.floor}</td>
                      <td className="px-4 py-3 text-right">{row.kmStart.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.kmEnd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{row.totalKm.toFixed(2)}</td>
                      <td className="px-4 py-3">{row.loadType}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.driverWages)}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.otherExpenses)}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.floorRent)}</td>
                      <td className="px-4 py-3 text-right">{formatAmount(row.totalAmount)}</td>
                      <td className="px-4 py-3">{row.dcNumber || "-"}</td>
                      <td className="px-4 py-3">{row.remark || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-4">
                          <Link href={`/dashboard/transport-management/bolero-delivery-log/${row.id}`}>
                            <button className="rbac-link" type="button">
                              <FaEdit />
                            </button>
                          </Link>
                          <button
                            className="rbac-link danger"
                            type="button"
                            onClick={() => handleDelete(row)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm text-slate-600">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <button
                className="rbac-button rbac-button-secondary"
                type="button"
                disabled={pageIndex >= pageCount - 1}
                onClick={() =>
                  setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                }
              >
                <FaChevronRight />
              </button>
            </div>

            <select
              className="rbac-input-filter w-auto"
              value={pageSize}
              onChange={(event) => {
                setPageIndex(0);
                setPageSize(Number(event.target.value));
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          title="Delete bolero delivery log"
          description={`Delete ${confirmTarget?.tripDescription || "this log"}?`}
          confirmLabel="Delete"
          confirmLoading={deleting}
          confirmLoadingLabel="Deleting..."
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onClose={() => {
            setConfirmOpen(false);
            setConfirmTarget(null);
          }}
        />
      </section>
    </DashboardShell>
  );
}

export default BoleroDeliveryLogListContent;
