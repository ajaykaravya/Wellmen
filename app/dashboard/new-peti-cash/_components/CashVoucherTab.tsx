"use client";

import { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { getTodayInputDate } from "@/lib/dateUtils";
import { incomeApi } from "@/lib/api/dashboard/income";
import { dailyExpenseApi } from "@/lib/api/dashboard/daily-expenses";
import type {
  CompanyOption,
  ExpenseTypeOption,
  IncomeTypeOption,
  ProjectOption,
  UserOption,
} from "@/lib/api/dashboard/shared-options";
import SharedLedgerSection from "./SharedLedgerSection";
import {
  STARTING_BALANCE_KEY,
  buildRemark,
  formatMoney,
  getUserDisplayName,
  isPrivilegedUser,
  type LedgerEntry,
  type TxKind,
} from "./types";
import { getCashVoucherTotals } from "./useNewPetiCashData";
import {
  AttachPhotoButton,
  DateField,
  FieldLabel,
  FormCard,
  IncomeExpenseToggle,
  SaveEntryButton,
  SelectInput,
  TextInput,
} from "./ui";

type Props = {
  companies: CompanyOption[];
  users: UserOption[];
  projects: ProjectOption[];
  incomeTypes: IncomeTypeOption[];
  expenseTypes: ExpenseTypeOption[];
  ledger: LedgerEntry[];
  onSaved: () => void;
};

export default function CashVoucherTab({
  companies,
  users,
  projects,
  incomeTypes,
  expenseTypes,
  ledger,
  onSaved,
}: Props) {
  const custodians = useMemo(
    () => users.filter((user) => isPrivilegedUser(user.role)),
    [users],
  );

  const [startingBalance, setStartingBalance] = useState("0");
  const [txKind, setTxKind] = useState<TxKind>("INCOME");
  const [companyId, setCompanyId] = useState("");
  const [custodianId, setCustodianId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayInputDate());
  const [projectRef, setProjectRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [billNo, setBillNo] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STARTING_BALANCE_KEY);
      if (stored != null) setStartingBalance(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!companyId && companies[0]) setCompanyId(companies[0].id);
  }, [companies, companyId]);

  useEffect(() => {
    if (!custodianId && custodians[0]) setCustodianId(custodians[0].id);
  }, [custodians, custodianId]);

  useEffect(() => {
    setCategoryId("");
  }, [txKind]);

  const cashTotals = useMemo(() => getCashVoucherTotals(ledger), [ledger]);
  const opening = Number(startingBalance || 0);
  const closing = opening + cashTotals.income - cashTotals.expense;

  const categoryOptions =
    txKind === "INCOME"
      ? incomeTypes.map((item) => ({ value: item.id, label: item.name }))
      : expenseTypes.map((item) => ({ value: item.id, label: item.name }));

  const persistStartingBalance = (value: string) => {
    setStartingBalance(value);
    try {
      localStorage.setItem(STARTING_BALANCE_KEY, value || "0");
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!companyId) nextErrors.companyId = "Entity is required.";
    if (!custodianId) nextErrors.custodianId = "Cash custodian is required.";
    if (!categoryId) {
      nextErrors.categoryId =
        txKind === "INCOME"
          ? "Income source is required."
          : "Expense type is required.";
    }
    if (!amount.trim() || Number(amount) <= 0) {
      nextErrors.amount = "Amount is required.";
    }
    if (!date.trim()) nextErrors.date = "Date is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const remark = buildRemark({ remarks, billNo, projectRef });

    try {
      setSaving(true);
      if (txKind === "INCOME") {
        await incomeApi.create({
          incomeTypeId: categoryId,
          projectId,
          incomeCompanyId: companyId,
          receivedById: custodianId,
          amount,
          paymentMode: "CASH",
          date,
          remark,
        });
      } else {
        await dailyExpenseApi.create({
          transactionType: "EXPENSE",
          amount,
          projectId,
          expenseTypeId: categoryId,
          expenseById: custodianId,
          expenseCompanyId: companyId,
          paymentMode: "CASH",
          date,
          remark,
        });
      }

      toast.success("Cash voucher saved successfully.");
      setAmount("");
      setRemarks("");
      setBillNo("");
      setProjectRef("");
      setPhotoName("");
      setDate(getTodayInputDate());
      onSaved();
    } catch (error) {
      console.error("Failed to save cash voucher", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save cash voucher.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-900 p-4 text-white">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <FaCalendarAlt size={14} className="text-slate-300" />
          Daily Cash Silak
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-800/80 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Opening (Main Head)
            </div>
            <div className="mt-1 text-lg font-bold">{formatMoney(opening)}</div>
          </div>
          <div className="rounded-lg bg-slate-800/80 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Closing (Main Head) = Silak Baki
            </div>
            <div className="mt-1 text-lg font-bold">{formatMoney(closing)}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Starting Balance
          </span>
          <input
            type="number"
            value={startingBalance}
            onChange={(e) => persistStartingBalance(e.target.value)}
            className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
          />
          <span className="text-[11px] text-slate-400">
            (set once when starting to use this)
          </span>
        </div>
      </div>

      <FormCard title="Cash Voucher" subtitle="Cash voucher entry">
        <div className="space-y-3">
          <div>
            <FieldLabel required>Entity</FieldLabel>
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
            <FieldLabel required>Cash Custodian</FieldLabel>
            <SelectInput
              value={custodianId}
              onChange={setCustodianId}
              options={custodians.map((item) => ({
                value: item.id,
                label: getUserDisplayName(item),
              }))}
              error={errors.custodianId}
            />
          </div>

          <div>
            <FieldLabel>Transaction</FieldLabel>
            <IncomeExpenseToggle value={txKind} onChange={setTxKind} />
          </div>

          <div>
            <FieldLabel required>
              {txKind === "INCOME" ? "Income Source" : "Expense Type"}
            </FieldLabel>
            <SelectInput
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              placeholder={
                txKind === "INCOME" ? "Select income source" : "Select expense type"
              }
              error={errors.categoryId}
            />
          </div>

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
            <FieldLabel optional>Project</FieldLabel>
            <SelectInput
              value={projectId}
              onChange={setProjectId}
              options={projects.map((item) => ({
                value: item.id,
                label: item.city ? `${item.name} (${item.city})` : item.name,
              }))}
              placeholder="Select project"
            />
          </div>

          <div>
            <FieldLabel optional>Project / Site Reference</FieldLabel>
            <TextInput
              value={projectRef}
              onChange={setProjectRef}
              placeholder="e.g. KIMS Hospital - ICU HVAC"
            />
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

          <SaveEntryButton saving={saving} onClick={handleSave} />
        </div>
      </FormCard>

      <SharedLedgerSection
        companies={companies}
        ledger={ledger}
        defaultSourceFilter="cashVoucher"
      />
    </div>
  );
}
