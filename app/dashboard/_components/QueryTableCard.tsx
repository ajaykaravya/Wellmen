"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { FaChevronRight, FaSpinner, FaEdit } from "react-icons/fa";
import { useDashboardContext } from "./DashboardShell";

type QueryRow = {
  id: string;
  projectId: string;
  projectName: string;
  projectCity: string | null;
  category: "REMARKS" | "URGENCY" | "DECISION_PENDING" | "";
  description: string;
  status: "PENDING" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdById: string;
  createdByName: string;
};

type QueryCardContainerProps<T> = {
  title: string;
  rows: QueryRow[];
  loading?: boolean;
  emptyLabel?: string;

  showCount?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;

  addHref?: string;
  addLabel?: string;

  secondaryHref?: string;
  secondaryLabel?: string;

  onUpdate?: (row: QueryRow) => void;
  renderActions?: (row: QueryRow) => ReactNode;
  actionLabel?: string;
  actionButtonClassName?: string;
};

export function QueryTableCard<T>({
  title,
  rows,
  loading = false,
  emptyLabel = "No data found",

  showCount = true,
  collapsible = true,
  defaultCollapsed = true,

  addHref,
  addLabel = "Add",

  secondaryHref,
  secondaryLabel,

  onUpdate,
  renderActions,
  actionLabel,
  actionButtonClassName = "rbac-button rbac-button-secondary",
}: QueryCardContainerProps<T>) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { isAdmin } = useDashboardContext();
  const formatText = (text: string) => {
    const formation = text.replaceAll("_", " ").toLowerCase();
    const formatted = formation.charAt(0).toUpperCase() + formation.slice(1);
    return formatted;
  };

  const getQueryStatusBadgeClass = (status: QueryRow["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-rose-100 text-rose-800 ring-1 ring-rose-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  };

  const getQueryPriorityBadgeClass = (priority: QueryRow["priority"]) => {
    switch (priority) {
      case "LOW":
        return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
      case "HIGH":
        return "bg-red-100 text-red-800 ring-1 ring-red-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  };

  return (
    <div className="rbac-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-2 w-full">
          <h3 className="sm:text-base text-sm font-medium w-full">
            {title}

            {showCount && (
              <span className="ml-2 text-white text-sm font-normal bg-[#2596be] px-2 py-1 rounded-full">
                {rows.length}
              </span>
            )}
          </h3>

          <div className="flex items-center justify-end gap-2 w-full">
            {addHref && (
              <Link href={addHref}>
                <button className="rbac-button" type="button">
                  {addLabel}
                </button>
              </Link>
            )}

            {secondaryHref && secondaryLabel && (
              <Link href={secondaryHref}>
                <button
                  className="rbac-button rbac-button-secondary"
                  type="button"
                >
                  {secondaryLabel}
                </button>
              </Link>
            )}

            {collapsible && (
              <button
                className="change-button change-button-secondary px-3 py-2 rounded-md"
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-expanded={!collapsed}
              >
                <FaChevronRight
                  className={`transition-transform duration-200 ${collapsed ? "" : "rotate-90"
                    }`}
                  size={14}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${!collapsible
          ? "mt-4 max-h-[4000px] opacity-100 translate-y-0"
          : collapsed
            ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
          }`}
      >
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="animate-spin mr-2" size={16} />
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="rbac-card py-4 text-sm">{emptyLabel}</div>
          )}

          {!loading &&
            rows.map((query) => (
              <div key={query.id} className="rbac-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold ">
                      {query.projectName || "Project"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {query.projectCity || "Project"}
                    </p>
                    <h4 className="text-sm">
                      {query.category ? formatText(query.category) : "Query"}
                    </h4>
                    <p className="text-sm">
                      {query.description || "No description"}
                    </p>
                    {isAdmin && (
                      <p className="text-sm">
                      <span>By:</span> {query.createdByName || ""}
                    </p>
                    )}
                  </div>
                  <div style={{alignItems:"end"}} className="flex flex-col gap-2">
                    <div className="flex gap-2 justify-end">
                      {renderActions
                        ? renderActions(query)
                        : onUpdate && (
                          <button
                            className={
                              actionLabel ? actionButtonClassName : "h-fit"
                            }
                            type="button"
                            onClick={() => onUpdate(query)}
                          >
                            {actionLabel ?? <FaEdit />}
                          </button>
                        )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getQueryStatusBadgeClass(
                        query.status,
                      )}`}
                    >
                      {formatText(query.status)}
                    </span>
                    <p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getQueryPriorityBadgeClass(
                          query.priority,
                        )}`}
                      >
                        {formatText(query.priority)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
