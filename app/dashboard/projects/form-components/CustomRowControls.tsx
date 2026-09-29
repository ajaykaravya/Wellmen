"use client";

import { FaPlus, FaTrash } from "react-icons/fa";
import {
  addCustomRow,
  removeCustomRow,
  setCustomRowLabel,
} from "@/lib/customRows";

// "+ Add Row" for a table. `scope` identifies the table whose rows it extends.
export function AddRowButton({
  scope,
  setFormData,
  label = "Add Row",
}: {
  scope: string;
  setFormData: any;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => setFormData((prev: any) => addCustomRow(prev, scope))}
      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
    >
      <FaPlus size={10} />
      {label}
    </button>
  );
}

// The description cell of an added row: its label is typed by the user, and it
// can be removed again.
export function CustomRowLabelCell({
  scope,
  row,
  setFormData,
  placeholder = "Enter description",
}: {
  scope: string;
  row: { key: string; label: string };
  setFormData: any;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        className="rbac-input w-full min-w-[140px]"
        placeholder={placeholder}
        value={row.label}
        onChange={(e) =>
          setFormData((prev: any) =>
            setCustomRowLabel(prev, scope, row.key, e.target.value),
          )
        }
      />
      <button
        type="button"
        title="Remove row"
        aria-label="Remove row"
        onClick={() =>
          setFormData((prev: any) => removeCustomRow(prev, scope, row.key))
        }
        className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <FaTrash size={11} />
      </button>
    </div>
  );
}
