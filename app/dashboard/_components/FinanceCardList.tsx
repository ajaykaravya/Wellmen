"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import {
  FaEdit,
  FaSpinner,
  FaTrash,
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaMinus,
  FaEye,
} from "react-icons/fa";
import { formatToDDMMYYYY, getTodayInputDate } from "../../../lib/dateUtils";
import CustomDatePicker from "../../components/CustomDatePicker";
import CompanyCodeBadge from "./CompanyCodeBadge";

export type FinanceCardListRow = {
  id: string;
  date: string;
  amount: number;
  details?: Array<ReactNode | null | undefined>;
  canManage?: boolean;
};

type FinanceCardAmountVariant = "income" | "expense" | "cash" | "neutral";

type FinanceCardContentConfig<T extends FinanceCardListRow> = {
  getVariant?: (row: T) => FinanceCardAmountVariant;
  getCode?: (row: T) => string | null | undefined;
  getTitle?: (row: T) => ReactNode;
  getTagLabel?: (row: T) => ReactNode;
  getTagClassName?: (row: T) => string;
  getDetails?: (row: T) => Array<ReactNode | null | undefined>;
  getPaymentLabel?: (row: T) => ReactNode;
  getProjectLabel?: (row: T) => ReactNode;
  getPersonLabel?: (row: T) => ReactNode;
  getRemark?: (row: T) => ReactNode;
  getDateLabel?: (row: T) => ReactNode;
  getPaymentMode?: (row: T) => string | null | undefined;
  getProjectName?: (row: T) => ReactNode;
  getProjectCity?: (row: T) => ReactNode;
  getReceivedByName?: (row: T) => ReactNode;
  getExpenseByName?: (row: T) => ReactNode;
  getCashGivenByName?: (row: T) => ReactNode;
  getCashGivenToName?: (row: T) => ReactNode;
  getCredit?: (row: T) => number;
  getDebit?: (row: T) => number;
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
  onView?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  renderAmountBadge?: (row: T) => ReactNode;
  renderDateLabel?: (row: T) => ReactNode;
  cardContent?: FinanceCardContentConfig<T>;
  renderCard?: (
    row: T,
    helpers: {
      actionNode: ReactNode;
      amountNode: ReactNode;
      formatAmount: (value: number) => string;
    },
  ) => ReactNode;
};

type CashPaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";

export function FinanceCardList<T extends FinanceCardListRow>({
  title,
  rows,
  loading = false,
  emptyLabel = "No records found.",
  showCount = true,
  addHref,
  addLabel = "View all",
  collapsible = true,
  defaultCollapsed = true,
  amountBadgeClassName = "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  showDatePicker = false,
  date,
  onDateChange,
  onEdit,
  onDelete,
  onView,
  renderActions,
  renderAmountBadge,
  renderDateLabel,
  cardContent,
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

  const CASH_PAYMENT_MODE_LABELS: Record<CashPaymentMode, string> = {
    CASH: "Cash",
    BANK: "Bank",
    CHEQUE: "Cheque",
    UPI: "UPI",
    NEFT_RTGS: "NEFT/RTGS",
  };

  const getCashPaymentModeLabel = (mode: CashPaymentMode | string | null | undefined) => {
    if (!mode) return "-";

    return (
      CASH_PAYMENT_MODE_LABELS[mode as CashPaymentMode] ??
      String(mode).replaceAll("_", " ")
    );
  }

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
        {onView && (
          <button
            style={{ padding: "2px" }}
            className="rbac-link"
            type="button"
            onClick={() => onView(row)}
            aria-label="View entry"
          >
            <FaEye size={18} />
          </button>
        )}
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

  const getVariantClassName = (variant: FinanceCardAmountVariant) => {
    if (variant === "income" || variant === "cash") return "text-emerald-700";
    if (variant === "expense") return "text-rose-700";
    return "text-slate-700";
  };

  const getVariantIcon = (variant: FinanceCardAmountVariant) => {
    if (variant === "income" || variant === "cash") return <FaPlus size={10} />;
    if (variant === "expense") return <FaMinus size={7} />;
    return null;
  };

  const formatAmount = (value?: number | null) => {
    if (value === null || value === undefined) return "";

    return `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
                  <span className="ml-2 rounded-full bg-[color:var(--brand)] px-2 py-1 text-sm font-normal text-white">
                    {rows.length}
                  </span>
                )}
              </h3>
            ) : null}
          </div>

          <div>
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <button
                className="change-button change-button-secondary rounded-md p-2"
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
                className="change-button change-button-secondary rounded-md p-2"
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
          <div className="mt-2 rbac-card py-4 text-sm text-slate-500">{emptyLabel}</div>
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

                  if (cardContent) {
                    const variant = cardContent.getVariant?.(row) ?? "neutral";
                    const code = cardContent.getCode?.(row) ?? "";
                    const title = cardContent.getTitle?.(row) ?? "";
                    const tagLabel = cardContent.getTagLabel?.(row) ?? "";
                    const tagClassName =
                      cardContent.getTagClassName?.(row) ??
                      "bg-slate-100 text-slate-700 ring-slate-200";
                    const details = (
                      cardContent.getDetails?.(row) ?? [
                      ]
                    ).filter(Boolean) as ReactNode[];
                    const remark = cardContent.getRemark?.(row) ?? "";
                    const dateLabel = cardContent.getDateLabel?.(row) ?? formatToDDMMYYYY(row.date);
                    const paymentMode = cardContent.getPaymentMode?.(row);
                    const projectName = cardContent.getProjectName?.(row);
                    const projectCity = cardContent.getProjectCity?.(row);
                    const receivedByName = cardContent.getReceivedByName?.(row);
                    const expenseByName = cardContent.getExpenseByName?.(row);
                    const cashGivenByName = cardContent.getCashGivenByName?.(row);
                    const cashGivenToName = cardContent.getCashGivenToName?.(row);
                    const credit = cardContent.getCredit?.(row) ?? "";
                    const debit = cardContent.getDebit?.(row) ?? "";

                    return (
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            {tagLabel ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ${tagClassName}`}
                              >
                                {tagLabel}
                              </span>
                            ) : null}
                            <CompanyCodeBadge code={code} />
                            <span className="min-w-0 truncate text-sm font-semibold">
                              {title}
                            </span>
                          </div>
                          {row.amount && (
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-semibold ${getVariantClassName(variant)}`}
                            >
                              {getVariantIcon(variant)}
                              {formatAmount(row.amount)}
                            </span>
                          )}
                          {typeof credit === "number" && credit > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-semibold ${getVariantClassName(variant)}`}
                            >
                              {getVariantIcon(variant)}
                              {formatAmount(credit)}
                            </span>
                          )}
                          {typeof debit === "number" && debit > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-semibold ${getVariantClassName(variant)}`}
                            >
                              {getVariantIcon(variant)}
                              {formatAmount(debit)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {paymentMode ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                              {getCashPaymentModeLabel(paymentMode)}
                            </span>
                          ) : null}

                          {
                            projectName && (
                              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200">
                                {projectName}
                                {projectCity ? ` (${projectCity})` : ""}
                              </span>
                            )
                          }

                          {
                            receivedByName && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                                {receivedByName}
                              </span>
                            )
                          }

                          {
                            expenseByName && (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                                {expenseByName}
                              </span>
                            )
                          }
                        </div>

                        {cashGivenByName && (
                          <div className="mt-2 md:mb-1 mb-0 flex flex-wrap items-center gap-2">
                            {
                              cashGivenByName && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                                  By: {cashGivenByName}
                                </span>
                              )
                            }

                            {
                              cashGivenToName && (
                                <span className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-800 ring-1 ring-cyan-200">
                                  To: {cashGivenToName}
                                </span>
                              )
                            }
                          </div>
                        )
                        }

                        {details.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {details.map((line, index) => (
                              <div key={`${row.id}-detail-${index}`}>{line}</div>
                            ))}
                          </div>
                        )}

                        <p className="mt-1 min-w-0 flex-1 break-words text-sm">{remark}</p>

                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm">{dateLabel}</div>
                          {actionNode ? <div className="flex-shrink-0">{actionNode}</div> : null}
                        </div>
                      </div>
                    );
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
