"use client";

export type NewPetiCashTab = "cashVoucher" | "directWhite" | "expenseMgmt";

export type PaymentMode = "CASH" | "BANK" | "CHEQUE" | "UPI" | "NEFT_RTGS";

export type TxKind = "INCOME" | "EXPENSE";

export type LedgerSource = "cashVoucher" | "directWhite";

export type LedgerEntry = {
  id: string;
  source: LedgerSource;
  kind: TxKind;
  amount: number;
  date: string;
  companyId: string | null;
  companyName: string | null;
  label: string;
  remark: string | null;
  paymentMode: string | null;
};

export const BANK_RESOURCES = [
  "ICICI Bank",
  "HDFC Bank",
  "SBI",
  "Axis Bank",
  "Kotak Bank",
] as const;

export const PAYMENT_MODE_OPTIONS: { key: PaymentMode; label: string }[] = [
  { key: "NEFT_RTGS", label: "NEFT/RTGS" },
  { key: "BANK", label: "Bank" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "UPI", label: "UPI" },
  { key: "CASH", label: "Cash" },
];

export const STARTING_BALANCE_KEY = "wellmen.new-peti-cash.starting-balance";

export const formatMoney = (value: number) =>
  `₹ ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

export const formatMoneyPrecise = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function buildRemark(parts: {
  remarks?: string;
  billNo?: string;
  vendor?: string;
  bankResource?: string;
  projectRef?: string;
}) {
  const chunks: string[] = [];
  if (parts.bankResource?.trim()) chunks.push(`Bank: ${parts.bankResource.trim()}`);
  if (parts.vendor?.trim()) chunks.push(`Vendor: ${parts.vendor.trim()}`);
  if (parts.billNo?.trim()) chunks.push(`Bill: ${parts.billNo.trim()}`);
  if (parts.projectRef?.trim()) chunks.push(`Ref: ${parts.projectRef.trim()}`);
  if (parts.remarks?.trim()) chunks.push(parts.remarks.trim());
  return chunks.join(" | ");
}

export function getUserDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}) {
  if (user.fullName?.trim()) return user.fullName.trim();
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
}

export function isPrivilegedUser(role?: string | null) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  return normalized === "admin" || normalized === "manager";
}

export function isManager(role?: string | null) {
  return String(role || "")
    .trim()
    .toLowerCase() === "manager";
}
