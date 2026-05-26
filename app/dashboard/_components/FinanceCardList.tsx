"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { FaEdit, FaSpinner, FaTrash, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { formatToDDMMYYYY, getTodayInputDate } from "../../../lib/dateUtils";
import CustomDatePicker from "../../components/CustomDatePicker";

export type FinanceCardListRow = {
  id: string;
  date: string;
  amount: number;
  details?: Array<ReactNode | null | undefined>;
  canManage?: boolean;
};

type FinanceCardListProps<T extends FinanceCardListRow> = {
  title?: string;
  rows: T[];
  loading?: boolean;
  emptyLabel?: string;
  showCount?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  addHref?: string;
  addLabel?: string;
  amountBadgeClassName?: string;
  showDatePicker?: boolean;
  date?: string;
  onDateChange?: (date: string) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  renderAmountBadge?: (row: T) => ReactNode;
  renderDateLabel?: (row: T) => ReactNode;
  renderCard?: (
    row: T,
    helpers: {
      actionNode: ReactNode;
      amountNode: ReactNode;
      formatAmount: (value: number) => string;
    },
  ) => ReactNode;
};

const formatAmount = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function FinanceCardList<T extends FinanceCardListRow>({
  title,
  rows,
  loading = false,
  emptyLabel = "No records found.",
  showCount = true,
  addHref,
  addLabel = "Add",
  collapsible = true,
  defaultCollapsed = true,
  amountBadgeClassName = "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  showDatePicker = false,
  date,
  onDateChange,
  onEdit,
  onDelete,
  renderActions,
  renderAmountBadge,
  renderDateLabel,
  renderCard,
}: FinanceCardListProps<T>) {
  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        details: (row.details || []).filter(Boolean) as ReactNode[],
      })),
    [rows],
  );

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [localDate, setLocalDate] = useState<string>(date ?? getTodayInputDate());

  const effectiveDate = date ?? localDate;

  const handleDateChange = (value: string) => {
    if (onDateChange) {
      onDateChange(value);
      return;
    }
    setLocalDate(value);
  };

  const shiftInputDate = (value: string, diffDays: number) => {
    let base: Date;
    if (value) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        base = new Date(year, month, day);
      } else {
        base = new Date();
      }
    } else {
      base = new Date();
    }

    if (Number.isNaN(base.getTime())) return getTodayInputDate();
    base.setDate(base.getDate() + diffDays);

    const day = base.getDate().toString().padStart(2, "0");
    const month = (base.getMonth() + 1).toString().padStart(2, "0");
    const year = base.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const shiftDate = (diff: number) => {
    const next = shiftInputDate(effectiveDate, diff);
    if (onDateChange) {
      onDateChange(next);
      return;
    }
    setLocalDate(next);
  };

  const renderDefaultActions = (row: T) => {
    const canManage = row.canManage !== false;
    if (!canManage || (!onEdit && !onDelete)) return null;

    return (
      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            className="rbac-link"
            type="button"
            onClick={() => onEdit(row)}
            aria-label="Edit entry"
          >
            <FaEdit size={18} />
          </button>
        )}
        {onDelete && (
          <button
            style={{ padding: "2px" }}
            className="rbac-link danger"
            type="button"
            onClick={() => onDelete(row)}
            aria-label="Delete entry"
          >
            <FaTrash size={18} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="rbac-card">
      {(title || addHref) && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {title ? (
              <h3 className="sm:text-base text-sm font-medium">
                {title}
                {showCount && (
                  <span className="ml-2 rounded-full bg-[#2596be] px-2 py-1 text-sm font-normal text-white">
                    {rows.length}
                  </span>
                )}
              </h3>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            {addHref ? (
              <Link href={addHref}>
                <button className="rbac-button" type="button">
                  {addLabel}
                </button>
              </Link>
            ) : null}
            {collapsible && (
              <button
                className="change-button change-button-secondary px-3 py-2 rounded-md"
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-expanded={!collapsed}
              >
                <FaChevronRight
                  className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"}`}
                  size={14}
                />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${!collapsible
          ? "mt-0 max-h-[4000px] opacity-100 translate-y-0"
          : collapsed
            ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            : "mt-0 max-h-[4000px] opacity-100 translate-y-0"
          }`}
      >

        {showDatePicker && (!collapsible || !collapsed) && (
          <div className="my-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              <button
                className="change-button change-button-secondary p-2 rounded-md"
                type="button"
                onClick={() => shiftDate(-1)}
              >
                <FaChevronLeft size={15} />
              </button>

              <CustomDatePicker
                value={effectiveDate}
                onChange={handleDateChange}
                placeholder="Select date"
                className="date-input"
              />

              <button
                className="change-button change-button-secondary p-2 rounded-md"
                type="button"
                onClick={() => shiftDate(1)}
              >
                <FaChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="mr-2 animate-spin" size={16} />
          </div>
        ) : normalizedRows.length === 0 ? (
          <div className="rbac-card py-4 text-sm text-slate-500">{emptyLabel}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {normalizedRows.map((row) => (
              <div key={row.id} className="rbac-card p-4">
                {(() => {
                  const actionNode = renderActions ? renderActions(row) : renderDefaultActions(row);
                  const amountNode = renderAmountBadge ? (
                    renderAmountBadge(row)
                  ) : (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${amountBadgeClassName}`}>
                      {formatAmount(row.amount)}
                    </span>
                  );

                  if (renderCard) {
                    return renderCard(row, {
                      actionNode,
                      amountNode,
                      formatAmount,
                    });
                  }

                  return (
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex gap-2">
                          <h4 className="text-sm font-semibold">
                            {renderDateLabel ? renderDateLabel(row) : formatToDDMMYYYY(row.date)}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {amountNode}
                          </div>
                        </div>

                        {row.details.length > 0 && (
                          <div className="space-y-1 text-sm text-slate-600">
                            {row.details.map((line, index) => (
                              <div key={`${row.id}-${index}`}>{line}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {actionNode ? <div className="flex justify-end">{actionNode}</div> : null}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
