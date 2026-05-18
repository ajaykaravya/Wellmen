"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  FaChevronRight,
  FaEdit,
  FaEye,
  FaLink,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import { formatToDDMMYYYY } from "@/lib/dateUtils";

export type ReportingCardRow = {
  id: string;
  reportDate: string;
  projectName: string;
  projectCity?: string | null;
  categoryName?: string | null;
  description?: string | null;
  imageUrls?: string[];
  videoUrl?: string | null;
  videoUrls?: string[];
  createdByName?: string | null;
  canManage?: boolean;
};

type ReportingCardListProps<T extends ReportingCardRow> = {
  title?: string;
  rows: T[];
  loading?: boolean;
  emptyLabel?: string;
  showCount?: boolean;
  addHref?: string;
  addLabel?: string;
  showEmployee?: boolean;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
};

export function ReportingCardList<T extends ReportingCardRow>({
  title,
  rows,
  loading = false,
  emptyLabel = "No reporting found.",
  showCount = false,
  addHref,
  addLabel = "Add Reporting",
  showEmployee = false,
  onView,
  onEdit,
  onDelete,
  renderActions,
}: ReportingCardListProps<T>) {
  const getHasMedia = (row: T) =>
    (row.imageUrls?.length ?? 0) > 0 ||
    (row.videoUrls?.length ?? 0) > 0 ||
    !!row.videoUrl;

  const renderDefaultActions = (row: T) => {
    const canManage = row.canManage !== false;
    return (
      <div className="flex items-center gap-2">
        {onView && (
          <button
            className="rbac-link"
            type="button"
            onClick={() => onView(row)}
            aria-label="View report"
          >
            <FaEye size={18} />
          </button>
        )}
        {onEdit && canManage && (
          <button
            className="rbac-link"
            type="button"
            onClick={() => onEdit(row)}
            aria-label="Edit report"
          >
            <FaEdit size={18} />
          </button>
        )}
        {onDelete && canManage && (
          <button
            style={{ padding: "2px" }}
            className="rbac-link danger"
            type="button"
            onClick={() => onDelete(row)}
            aria-label="Delete report"
          >
            <FaTrash size={18} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {(title || addHref) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h3 className="sm:text-base text-sm font-medium">{title}</h3>
          ) : null}
          <div className="flex items-center gap-2">
            {addHref ? (
              <Link href={addHref}>
                <button className="rbac-button" type="button">
                  {addLabel}
                </button>
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin mr-2" size={16} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rbac-card py-4 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rbac-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">
                    {row.projectName || ""}
                  </p>
                  <p className="text-sm text-slate-500">
                    {row.projectCity || ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {getHasMedia(row) && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        <FaLink size={12} />
                      </span>
                    )}
                    {renderActions
                      ? renderActions(row)
                      : renderDefaultActions(row)}
                  </div>
                  {showCount && (
                    <span className="inline-flex rounded-full bg-[#2596be] px-2 py-1 text-xs font-medium text-white">
                      {rows.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <p className="text-sm">{row.categoryName || ""}</p>
                <p>{row.description || "No description"}</p>
                <div className="flex justify-between items-center">
                  {showEmployee && row.createdByName !== undefined ? (
                    <p>
                      <span className="font-semibold">By:</span>{" "}
                      {row.createdByName || ""}
                    </p>
                  ) : <p></p>}
                  <p className="text-xs uppercase flex justify-end">
                    {formatToDDMMYYYY(row.reportDate)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
