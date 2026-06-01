"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import DashboardShell from "../../_components/DashboardShell";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { ButtonGroup } from "../../_components/ButtonGroup";
import TransportConfigFormContent from "./TransportConfigFormContent";
import {
  getTransportConfigTypeLabel,
  getTransportTypeLabel,
  TRANSPORT_TYPES,
} from "@/lib/transport-management";

type TransportConfigRow = {
  id: string;
  transportType: string;
  transportTypeLabel: string;
  configType: string;
  configTypeLabel: string;
  floor: string | null;
  loadType: string | null;
  minKm: number | null;
  maxKm: number | null;
  tripType: string | null;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type TransportType = (typeof TRANSPORT_TYPES)[number]["key"];

const DEFAULT_TRANSPORT_TYPE =
  TRANSPORT_TYPES[0]?.key ?? "BOLERO_DELIVERY";

const isValidTransportType = (value: string | null): value is TransportType =>
  Boolean(value && TRANSPORT_TYPES.some((option) => option.key === value));

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function TransportConfigListContent() {
  const [rows, setRows] = useState<TransportConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<TransportConfigRow | null>(null);
  const [selectedTransportType, setSelectedTransportType] =
    useState<TransportType>(DEFAULT_TRANSPORT_TYPE);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  const transportTypeOptions = useMemo(
    () =>
      TRANSPORT_TYPES
        .filter(
          (option) =>
            option.key !== "LOADING_VEHICLE" &&
            option.key !== "PORTER_DAILY",
        )
        .map((option) => ({
          key: option.key,
          label: option.shortLabel,
        })),
    [],
  );

  const buildRuleSummary = useCallback((row: TransportConfigRow) => {
    switch (row.configType) {
      case "FLOOR_RENT":
        return `${row.floor || "-"} / ${row.loadType || "-"}`;
      case "DRIVER_WAGE_SLAB":
        return `${row.minKm ?? "-"} km to ${row.maxKm ?? "-"} km`;
      case "COURIER_WEIGHT_RATE":
        return "Per KG";
      case "COURIER_COVER_RATE":
        return "Per cover";
      case "CNG_TRIP_SLAB":
        return `${row.tripType || "-"} / ${row.minKm ?? "-"} km to ${row.maxKm ?? "-"} km`;
      default:
        return "-";
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transport-configs?transportType=${selectedTransportType}`,
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to load transport configs.");
        return;
      }

      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to load transport configs", error);
      toast.error("Failed to load transport configs.");
    } finally {
      setLoading(false);
    }
  }, [selectedTransportType]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedTransportType]);

  const handleSelectTransportType = useCallback(
    (value: string) => {
      if (!isValidTransportType(value)) return;
      setSelectedTransportType(value);
      setEditingConfigId(null);
      setFormResetKey((prev) => prev + 1);
    },
    [],
  );

  const handleDelete = useCallback((row: TransportConfigRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  }, []);

  const handleEdit = useCallback((row: TransportConfigRow) => {
    if (!isValidTransportType(row.transportType)) return;
    setSelectedTransportType(row.transportType);
    setEditingConfigId(row.id);
    setFormResetKey((prev) => prev + 1);
  }, []);

  const handleFormSaved = useCallback(() => {
    setEditingConfigId(null);
    setFormResetKey((prev) => prev + 1);
    loadRows();
  }, [loadRows]);

  const handleFormCancel = useCallback(() => {
    setEditingConfigId(null);
    setFormResetKey((prev) => prev + 1);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transport-configs/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete transport config.");
        return;
      }
      await loadRows();
      toast.success("Transport config deleted successfully.");
    } catch (error) {
      console.error("Failed to delete transport config", error);
      toast.error("Failed to delete transport config.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }, [confirmTarget, loadRows]);

  const columns = useMemo<ColumnDef<TransportConfigRow>[]>(
    () => [
      {
        header: "Transport Type",
        accessorKey: "transportType",
        cell: ({ row }) => (
          <span>
            {row.original.transportTypeLabel ||
              getTransportTypeLabel(row.original.transportType)}
          </span>
        ),
      },
      {
        header: "Config Type",
        accessorKey: "configType",
        cell: ({ row }) => (
          <span>
            {row.original.configTypeLabel ||
              getTransportConfigTypeLabel(row.original.configType)}
          </span>
        ),
      },
      {
        header: "Rule",
        id: "rule",
        cell: ({ row }) => <span>{buildRuleSummary(row.original)}</span>,
      },
      {
        header: "Rate",
        accessorKey: "rate",
        cell: ({ row }) => <span>₹{formatMoney(row.original.rate)}</span>,
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
              <button
                className="rbac-link"
                type="button"
                aria-label="Edit transport config"
                onClick={() => handleEdit(row.original)}
              >
                <FaEdit />
              </button>
            <button
              className="rbac-link danger"
              type="button"
              aria-label="Delete transport config"
              onClick={() => handleDelete(row.original)}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [buildRuleSummary, handleDelete , handleEdit],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageCount = Math.max(1, table.getPageCount());

  return (
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="rbac-title-lg">Transport Config</h3>
              <p className="rbac-muted">
                Manage transport config rules by transport type.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ButtonGroup
              title="Transport Type"
              selected={selectedTransportType}
              options={transportTypeOptions}
              onSelect={(value) => handleSelectTransportType(value)}
            />
          </div>

          <div className="mt-6">
            <TransportConfigFormContent
              key={`${selectedTransportType}-${editingConfigId || "new"}-${formResetKey}`}
              embedded
              transportConfigId={editingConfigId ?? undefined}
              initialTransportType={selectedTransportType}
              onSaved={handleFormSaved}
              onCancel={handleFormCancel}
            />
          </div>

          <div className="mt-6 hidden md:block overflow-x-auto">
            <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
              <thead className="bg-slate-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200 ${
                          header.id === "action" ? "text-right" : "text-left"
                        }`}
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
                      className="px-4 py-6 text-center text-slate-500"
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
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No transport configs found.
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
                          className={`px-4 py-3 text-sm border-b border-slate-100 ${
                            cell.column.id === "action" ? "text-right" : ""
                          }`}
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

          <div className="md:hidden mt-5">
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="animate-spin mr-2" size={16} />
                </div>
              )}
              {!loading && rows.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No transport configs found.
                </div>
              )}
              {!loading &&
                table.getRowModel().rows.map((row) => (
                  <div key={row.id} className="rbac-card p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {row.original.transportTypeLabel ||
                              getTransportTypeLabel(row.original.transportType)}
                          </span>
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                            ₹{formatMoney(row.original.rate)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">
                            {row.original.configTypeLabel ||
                              getTransportConfigTypeLabel(row.original.configType)}
                          </p>
                          <p className="text-slate-500">
                            {buildRuleSummary(row.original)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                          <button
                            className="rbac-link"
                            type="button"
                            aria-label="Edit transport config"
                            onClick={() => handleEdit(row.original)}
                          >
                            <FaEdit size={18} />
                          </button>
                        <button
                          className="rbac-link danger"
                          type="button"
                          aria-label="Delete transport config"
                          onClick={() => handleDelete(row.original)}
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
              <button
                className="change-button change-button-secondary"
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <FaChevronLeft size={20} />
              </button>
              <span>
                Page {pagination.pageIndex + 1} of {pageCount}
              </span>
              <button
                className="change-button change-button-secondary"
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <FaChevronRight size={20} />
              </button>
            </div>
            <div>
              <select
                className="rbac-input rbac-select rbac-pagination"
                value={pagination.pageSize}
                onChange={(event) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(event.target.value),
                  });
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
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete transport config?"
        description={
          confirmTarget
            ? `Remove ${buildRuleSummary(confirmTarget)} config?`
            : "Remove this transport config?"
        }
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
    </DashboardShell>
  );
}
