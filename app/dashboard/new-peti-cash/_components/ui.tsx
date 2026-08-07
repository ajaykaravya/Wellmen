"use client";

import { type ReactNode } from "react";
import { FaPaperclip } from "react-icons/fa";
import CustomDatePicker from "../../../components/CustomDatePicker";

export function FieldLabel({
  children,
  optional,
}: {
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {children}
      {optional ? (
        <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">
          (optional)
        </span>
      ) : null}
    </label>
  );
}

export function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-dashed border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  error?: string;
}) {
  if (prefix) {
    return (
      <div>
        <div
          className={`rbac-input flex items-center gap-1 !py-0 ${
            error ? "!border-rose-400" : ""
          }`}
        >
          <span className="shrink-0 text-sm font-semibold text-[color:var(--theme-text-muted)]">
            {prefix}
          </span>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full !border-0 !bg-transparent !p-0 py-3 shadow-none outline-none focus:!outline-none focus:!ring-0"
          />
        </div>
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rbac-input ${error ? "!border-rose-400" : ""}`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Select",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rbac-input rbac-select ${error ? "!border-rose-400" : ""}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function DateField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <CustomDatePicker
        value={value}
        onChange={onChange}
        className={`theme-input rbac-input w-full pr-10 ${
          error ? "!border-rose-400" : ""
        }`}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function IncomeExpenseToggle({
  value,
  onChange,
}: {
  value: "INCOME" | "EXPENSE";
  onChange: (value: "INCOME" | "EXPENSE") => void;
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => onChange("INCOME")}
        className={`py-2.5 text-sm font-semibold transition-colors ${
          value === "INCOME"
            ? "bg-teal-700 text-white"
            : "bg-white text-slate-700"
        }`}
      >
        Income
      </button>
      <button
        type="button"
        onClick={() => onChange("EXPENSE")}
        className={`py-2.5 text-sm font-semibold transition-colors ${
          value === "EXPENSE"
            ? "bg-rose-700 text-white"
            : "bg-white text-slate-700"
        }`}
      >
        Expense
      </button>
    </div>
  );
}

export function SaveEntryButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
    >
      {saving ? "Saving..." : "+ Save Entry"}
    </button>
  );
}

export function AttachPhotoButton({
  fileName,
  onFile,
}: {
  fileName?: string;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
      <FaPaperclip size={14} />
      <span className="truncate">{fileName || "Attach Photo"}</span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
    </label>
  );
}

export function FilterPill({
  label,
  active,
  tone = "navy",
  onClick,
}: {
  label: string;
  active: boolean;
  tone?: "navy" | "orange" | "teal";
  onClick: () => void;
}) {
  const activeClass =
    tone === "orange"
      ? "bg-orange-500 text-white border-orange-500"
      : tone === "teal"
        ? "bg-teal-700 text-white border-teal-700"
        : "bg-slate-800 text-white border-slate-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? activeClass
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

export function SummaryCards({
  income,
  expense,
  net,
}: {
  income: number;
  expense: number;
  net: number;
}) {
  const format = (value: number) =>
    `₹ ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-1 text-emerald-600">↗</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Income
        </div>
        <div className="text-sm font-bold text-slate-900">{format(income)}</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-1 text-rose-600">↘</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Expense
        </div>
        <div className="text-sm font-bold text-slate-900">{format(expense)}</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-1 text-slate-400">☰</div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Net
        </div>
        <div className="text-sm font-bold text-slate-900">{format(net)}</div>
      </div>
    </div>
  );
}

export function LedgerEmpty({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {message || "No entries yet. Save a voucher above to get started."}
    </div>
  );
}

export function LedgerList({
  title = "LEDGER",
  children,
  empty,
}: {
  title?: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      {empty ? <LedgerEmpty /> : <div className="space-y-2">{children}</div>}
    </div>
  );
}
