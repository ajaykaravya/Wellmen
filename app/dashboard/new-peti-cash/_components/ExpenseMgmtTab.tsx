"use client";

import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaUser, FaWallet } from "react-icons/fa";
import { toast } from "react-toastify";
import { getTodayInputDate, formatToDDMMYYYY } from "@/lib/dateUtils";
import { petiCashApi } from "@/lib/api/dashboard/peti-cash";
import { loadEmployeeFinancialReport } from "@/lib/api/dashboard/employee-financial-report";
import { useDashboardContext } from "../../_components/DashboardShell";
import type {
  CompanyOption,
  ExpenseTypeOption,
  UserOption,
} from "@/lib/api/dashboard/shared-options";
import {
  buildRemark,
  formatMoney,
  getUserDisplayName,
  isManager,
  isPrivilegedUser,
} from "./types";
import {
  AttachPhotoButton,
  DateField,
  FieldLabel,
  FilterPill,
  FormCard,
  LedgerEmpty,
  SaveEntryButton,
  SelectInput,
  TextInput,
} from "./ui";

type EntryMode = "ADVANCE" | "CLAIM";

type PetiRow = {
  id: string;
  transactionType: "CREDIT" | "DEBIT";
  amount: number;
  date: string;
  remarks: string | null;
  givenByName: string | null;
  givenToName: string | null;
  expenseTypeName: string | null;
  isAdvance: boolean;
  givenToId: string | null;
};

type Props = {
  companies: CompanyOption[];
  users: UserOption[];
  expenseTypes: ExpenseTypeOption[];
};

export default function ExpenseMgmtTab({
  companies,
  users,
  expenseTypes,
}: Props) {
  const { user: sessionUser } = useDashboardContext();
  const managers = useMemo(
    () => users.filter((item) => isManager(item.role)),
    [users],
  );

  const [categoryId, setCategoryId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>("CLAIM");
  const [expenseTypeId, setExpenseTypeId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayInputDate());
  const [remarks, setRemarks] = useState("");
  const [billNo, setBillNo] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState({
    advance: 0,
    claimed: 0,
    remaining: 0,
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [ledgerRows, setLedgerRows] = useState<PetiRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (!categoryId && expenseTypes[0]) setCategoryId(expenseTypes[0].id);
  }, [expenseTypes, categoryId]);

  useEffect(() => {
    if (!companyId && companies[0]) setCompanyId(companies[0].id);
  }, [companies, companyId]);

  const selectedCategory = useMemo(
    () => expenseTypes.find((item) => item.id === categoryId) || null,
    [expenseTypes, categoryId],
  );

  const categoryUsers = useMemo(() => {
    // Claims must use users assigned to the expense type.
    // Advances must go to non-admin/non-manager employees.
    if (entryMode === "CLAIM") {
      const assigned = selectedCategory?.users || [];
      if (assigned.length > 0) {
        return assigned.map((item) => ({
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          role: null,
        })) as UserOption[];
      }
    }

    return users.filter((item) => !isPrivilegedUser(item.role));
  }, [selectedCategory, users, entryMode]);

  useEffect(() => {
    if (!selectedUserId && categoryUsers[0]) {
      setSelectedUserId(categoryUsers[0].id);
    } else if (
      selectedUserId &&
      categoryUsers.length > 0 &&
      !categoryUsers.some((item) => item.id === selectedUserId)
    ) {
      setSelectedUserId(categoryUsers[0].id);
    }
  }, [categoryUsers, selectedUserId]);

  useEffect(() => {
    setExpenseTypeId(categoryId);
  }, [categoryId]);

  useEffect(() => {
    const assignees =
      expenseTypes.find((item) => item.id === expenseTypeId)?.users || [];
    if (assignees[0]) {
      setAssigneeId(assignees[0].id);
    } else {
      setAssigneeId(selectedUserId);
    }
  }, [expenseTypeId, expenseTypes, selectedUserId]);

  const selectedUser = useMemo(
    () => categoryUsers.find((item) => item.id === selectedUserId) || null,
    [categoryUsers, selectedUserId],
  );

  const givenById = useMemo(() => {
    if (
      sessionUser?.id &&
      managers.some((item) => item.id === sessionUser.id)
    ) {
      return sessionUser.id;
    }
    return managers[0]?.id || "";
  }, [managers, sessionUser]);

  const [givenByOverride, setGivenByOverride] = useState("");
  const resolvedGivenById = givenByOverride || givenById;

  const loadBalanceAndLedger = async (userId: string) => {
    if (!userId) {
      setBalance({ advance: 0, claimed: 0, remaining: 0 });
      setLedgerRows([]);
      return;
    }

    try {
      setBalanceLoading(true);
      setLedgerLoading(true);

      const [report, petiRes] = await Promise.all([
        loadEmployeeFinancialReport({ userId }) as Promise<{
          summary?: {
            totalGivenTo?: number;
            totalExpenseBy?: number;
            balance?: number;
          };
        }>,
        petiCashApi.list({ pageSize: 200 }) as Promise<{ data?: PetiRow[] }>,
      ]);

      setBalance({
        advance: Number(report?.summary?.totalGivenTo || 0),
        claimed: Number(report?.summary?.totalExpenseBy || 0),
        remaining: Number(report?.summary?.balance || 0),
      });

      const rows = (petiRes?.data || []).filter(
        (row) => row.givenToId === userId || row.givenToName === getUserDisplayName(selectedUser || {}),
      );
      setLedgerRows(rows);
    } catch (error) {
      console.error("Failed to load expense management data", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load expense management data.",
      );
    } finally {
      setBalanceLoading(false);
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceAndLedger(selectedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!categoryId) nextErrors.categoryId = "Category is required.";
    if (!selectedUserId) nextErrors.selectedUserId = "User is required.";
    if (!expenseTypeId) nextErrors.expenseTypeId = "Expense type is required.";
    if (!companyId) nextErrors.companyId = "Company is required.";
    if (!resolvedGivenById) {
      nextErrors.givenById = "Manager (given by) is required.";
    }
    if (!amount.trim() || Number(amount) <= 0) {
      nextErrors.amount = "Amount is required.";
    }
    if (!date.trim()) nextErrors.date = "Date is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const isAdvance = entryMode === "ADVANCE";
    const remark = buildRemark({ remarks, billNo });

    try {
      setSaving(true);
      await petiCashApi.create({
        transactionType: "DEBIT",
        amount,
        givenById: resolvedGivenById,
        givenToId: selectedUserId,
        companyId,
        projectId: "",
        expenseTypeId,
        isAdvance,
        paymentMode: isAdvance ? "" : "CASH",
        date,
        remarks: remark,
      });

      toast.success(
        entryMode === "ADVANCE"
          ? "Advance given saved successfully."
          : "Expense claim saved successfully.",
      );
      setAmount("");
      setRemarks("");
      setBillNo("");
      setPhotoName("");
      setDate(getTodayInputDate());
      await loadBalanceAndLedger(selectedUserId);
    } catch (error) {
      console.error("Failed to save expense management entry", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save expense management entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    const el = document.getElementById("npc-category-scroll");
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -160 : 160, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Category
          <span className="ml-0.5 text-rose-600" title="Required">
            *
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-600"
          >
            <FaChevronLeft size={12} />
          </button>
          <div
            id="npc-category-scroll"
            className="flex flex-1 gap-2 overflow-x-auto pb-1"
          >
            {expenseTypes.map((item) => (
              <FilterPill
                key={item.id}
                label={item.name}
                active={categoryId === item.id}
                onClick={() => setCategoryId(item.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-600"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
        {errors.categoryId ? (
          <p className="mt-1 text-xs text-rose-600">{errors.categoryId}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {categoryUsers.slice(0, 6).map((item) => {
          const active = selectedUserId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedUserId(item.id)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <FaUser size={14} />
              {getUserDisplayName(item)}
            </button>
          );
        })}
      </div>
      {errors.selectedUserId ? (
        <p className="text-xs text-rose-600">{errors.selectedUserId}</p>
      ) : null}

      <div className="rounded-xl bg-slate-900 p-4 text-white">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <FaWallet size={14} className="text-slate-300" />
          {getUserDisplayName(selectedUser || {}) || "User"} - Balance
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-800 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase text-slate-400">
              Advance
            </div>
            <div className="mt-1 text-sm font-bold">
              {balanceLoading ? "..." : formatMoney(balance.advance)}
            </div>
          </div>
          <div className="rounded-lg bg-slate-800 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase text-slate-400">
              Claimed
            </div>
            <div className="mt-1 text-sm font-bold">
              {balanceLoading ? "..." : formatMoney(balance.claimed)}
            </div>
          </div>
          <div className="rounded-lg bg-orange-500 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase text-orange-100">
              Remaining
            </div>
            <div className="mt-1 text-sm font-bold">
              {balanceLoading ? "..." : formatMoney(balance.remaining)}
            </div>
          </div>
        </div>
      </div>

      <FormCard
        title="Expense Management Entry"
        subtitle={`${selectedCategory?.name || "Category"} - ${getUserDisplayName(selectedUser || {}) || "User"}`}
      >
        <div className="space-y-3">
          <div>
            <FieldLabel>Entry Type</FieldLabel>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setEntryMode("ADVANCE")}
                className={`py-2.5 text-sm font-semibold transition-colors ${
                  entryMode === "ADVANCE"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                Advance Given
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("CLAIM")}
                className={`py-2.5 text-sm font-semibold transition-colors ${
                  entryMode === "CLAIM"
                    ? "bg-rose-700 text-white"
                    : "bg-white text-slate-700"
                }`}
              >
                Expense Claim
              </button>
            </div>
          </div>

          <div>
            <FieldLabel required>Company</FieldLabel>
            <SelectInput
              value={companyId}
              onChange={setCompanyId}
              options={companies.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              error={errors.companyId}
            />
          </div>

          <div>
            <FieldLabel required>Given By (Manager)</FieldLabel>
            <SelectInput
              value={resolvedGivenById}
              onChange={setGivenByOverride}
              options={managers.map((item) => ({
                value: item.id,
                label: getUserDisplayName(item),
              }))}
              error={errors.givenById}
            />
          </div>

          <div>
            <FieldLabel required>Expense Type</FieldLabel>
            <SelectInput
              value={expenseTypeId}
              onChange={setExpenseTypeId}
              options={expenseTypes.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              error={errors.expenseTypeId}
            />
          </div>

          {(expenseTypes.find((item) => item.id === expenseTypeId)?.users || [])
            .length > 0 ? (
            <div>
              <FieldLabel>Assignee Detail</FieldLabel>
              <SelectInput
                value={assigneeId}
                onChange={(value) => {
                  setAssigneeId(value);
                  setSelectedUserId(value);
                }}
                options={(
                  expenseTypes.find((item) => item.id === expenseTypeId)?.users ||
                  []
                ).map((item) => ({
                  value: item.id,
                  label: `${item.firstName} ${item.lastName}`.trim(),
                }))}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Amount</FieldLabel>
              <TextInput
                value={amount}
                onChange={setAmount}
                placeholder="0"
                type="number"
                prefix="₹"
                error={errors.amount}
              />
            </div>
            <div>
              <FieldLabel required>Date</FieldLabel>
              <DateField value={date} onChange={setDate} error={errors.date} />
            </div>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <TextInput
              value={remarks}
              onChange={setRemarks}
              placeholder="Short note"
            />
          </div>

          <div>
            <FieldLabel optional>Bill Attachment</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                value={billNo}
                onChange={setBillNo}
                placeholder="Bill / Invoice No."
              />
              <AttachPhotoButton
                fileName={photoName}
                onFile={(file) => setPhotoName(file?.name || "")}
              />
            </div>
          </div>

          {errors.givenById ? (
            <p className="text-xs text-rose-600">{errors.givenById}</p>
          ) : null}

          <SaveEntryButton saving={saving} onClick={handleSave} />
        </div>
      </FormCard>

      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {getUserDisplayName(selectedUser || {}) || "User"} — Ledger
        </h4>
        {ledgerLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading...
          </div>
        ) : ledgerRows.length === 0 ? (
          <LedgerEmpty message="No entries yet." />
        ) : (
          <div className="space-y-2">
            {ledgerRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {formatToDDMMYYYY(row.date)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {row.isAdvance ? "Advance Given" : "Expense Claim"}
                    {row.expenseTypeName ? ` · ${row.expenseTypeName}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.givenByName || "-"} → {row.givenToName || "-"}
                  </p>
                </div>
                <div className="text-sm font-bold text-rose-600">
                  {formatMoney(row.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
