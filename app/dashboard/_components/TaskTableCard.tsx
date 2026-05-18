"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { FaChevronRight, FaEdit, FaSpinner } from "react-icons/fa";

export type TaskTableCardRow = {
  id: string;
  title: string;
  description: string | null;
  comments?: string | null;
  status: string;
  projectName?: string | null;
  projectCity?: string | null;
  categoryName?: string | null;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    role?: string | null;
  } | null;
};

type TaskTableCardProps<T extends TaskTableCardRow> = {
  title: string;
  rows: T[];
  loading: boolean;
  emptyLabel: string;
  addTaskHref?: string;
  addTaskLabel?: string;
  showHeader?: boolean;
  showCount?: boolean;
  collapsible?: boolean;
  actionLabel?: string;
  actionButtonClassName?: string;
  onUpdate?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
};

const formatStatusText = (value: string) => {
  const formation = value.replaceAll("_", " ").toLowerCase();
  return formation.charAt(0).toUpperCase() + formation.slice(1);
};

const getTaskStatusBadgeClass = (status: string) => {
  switch (status) {
    case "TODO":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
    case "ON_HOLD":
      return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 ring-1 ring-green-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

export function TaskTableCard<T extends TaskTableCardRow>({
  title,
  rows,
  loading,
  emptyLabel,
  addTaskHref,
  addTaskLabel = "Add Task",
  showHeader = true,
  showCount = true,
  collapsible = true,
  actionLabel,
  actionButtonClassName = "rbac-button rbac-button-secondary",
  onUpdate,
  renderActions,
}: TaskTableCardProps<T>) {
  const [collapsed, setCollapsed] = useState(true);

  if (!showHeader) {
    return (
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin mr-2" size={16} />
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="rbac-card py-4 text-sm ">{emptyLabel}</div>
        )}
        {!loading &&
          rows.map((task) => (
            <div key={task.id} className="flex rbac-card p-4 sm:p-5 items-start">
              <div className="w-full grid text-sm">
                {task.projectName && (
                  <p className="font-semibold text-base">{task.projectName}</p>
                )}
                {task.projectCity && (
                  <p className="text-sm text-slate-500">{task.projectCity}</p>
                )}
                {"categoryName" in task && (
                  <p className="text-sm">{task.categoryName || ""}</p>
                )}
                {task.description && (
                  <p className="text-sm">{task.description}</p>
                )}
                {"comments" in task && (
                  <p className="text-sm">{task.comments || ""}</p>
                )}
                {task.assignee && (
                  <p className="text-sm">
                    {task.assignee.firstName} {task.assignee.lastName}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                {renderActions
                  ? renderActions(task)
                  : onUpdate && (
                      <button
                        className={
                          actionLabel ? actionButtonClassName : "h-fit"
                        }
                        type="button"
                        onClick={() => onUpdate(task)}
                      >
                        {actionLabel ?? <FaEdit />}
                      </button>
                    )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium tracking-[0.2em] w-max ${getTaskStatusBadgeClass(
                    task.status,
                  )}`}
                >
                  {formatStatusText(task.status)}
                </span>

                
              </div>
            </div>
          ))}
      </div>
    );
  }

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
          <div className="flex items-center gap-2 justify-end w-full">
            {addTaskHref && (
              <Link href={addTaskHref}>
                <button className="rbac-button" type="button">
                  {addTaskLabel}
                </button>
              </Link>
            )}
            <button
              className="change-button change-button-secondary px-3 py-2 rounded-md"
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
            >
              <FaChevronRight
                className={`transition-transform duration-200 ${
                  collapsed ? "" : "rotate-90"
                }`}
                size={14}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin-top] duration-300 ease-in-out ${
          !collapsible
            ? "mt-4 max-h-[4000px] opacity-100 translate-y-0"
            : collapsed
            ? "mt-0 max-h-0 opacity-0 -translate-y-2 pointer-events-none"
            : "mt-4 max-h-[4000px] opacity-100 translate-y-0"
        }`}
        aria-hidden={collapsible ? collapsed : false}
      >
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <FaSpinner className="animate-spin mr-2" size={16} />
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="rbac-card py-4 text-sm ">{emptyLabel}</div>
          )}
          {!loading &&
            rows.map((task) => (
              <div key={task.id} className="flex rbac-card p-4 sm:p-5 items-start">
                <div className="w-full grid text-sm">
                  {task.projectName && (
                    <p className="font-semibold text-base">
                      {task.projectName}
                    </p>
                  )}
                  {task.projectCity && (
                    <p className="text-sm text-slate-500">{task.projectCity}</p>
                  )}
                  {"categoryName" in task && (
                    <p className="text-sm">{task.categoryName || ""}</p>
                  )}
                  {task.description && (
                    <p className="text-sm">{task.description}</p>
                  )}
                  {"comments" in task && (
                    <p className="text-sm">{task.comments || ""}</p>
                  )}
                  {task.assignee && (
                    <p className="text-sm">
                      {task.assignee.firstName} {task.assignee.lastName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="mt-1 text-base font-semibold theme-text">
                      {task.title}
                    </h4>
                  </div>
                  <div className="flex gap-2 justify-end">
                  {renderActions
                    ? renderActions(task)
                    : onUpdate && (
                        <button
                          className={
                            actionLabel ? actionButtonClassName : "h-fit"
                          }
                          type="button"
                          onClick={() => onUpdate(task)}
                        >
                          {actionLabel ?? <FaEdit />}
                        </button>
                      )}
                </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium w-max ${getTaskStatusBadgeClass(
                      task.status,
                    )}`}
                  >
                    {formatStatusText(task.status)}
                  </span>
                </div>

                
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export { formatStatusText, getTaskStatusBadgeClass };
