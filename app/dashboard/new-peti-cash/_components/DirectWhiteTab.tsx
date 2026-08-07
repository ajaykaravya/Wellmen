"use client";

import { useEffect, useMemo, useState } from "react";
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
  BANK_RESOURCES,
  PAYMENT_MODE_OPTIONS,
  buildRemark,
  getUserDisplayName,
  isPrivilegedUser,
  type LedgerEntry,
  type PaymentMode,
  type TxKind,
} from "./types";
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

export default function DirectWhiteTab({
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

  const bankPaymentModes = PAYMENT_MODE_OPTIONS.filter(
    (item) => item.key !== "CASH",
  );

  const [txKind, setTxKind] = useState<TxKind>("INCOME");
  const [companyId, setCompanyId] = useState("");
  const [bankResource, setBankResource] = useState<string>(BANK_RESOURCES[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("NEFT_RTGS");
  const [vendor, setVendor] = useState("");
  const [receivedById, setReceivedById] = useState("");
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
    if (!companyId && companies[0]) setCompanyId(companies[0].id);
  }, [companies, companyId]);

  useEffect(() => {
    if (!receivedById && custodians[0]) setReceivedById(custodians[0].id);
  }, [custodians, receivedById]);

  useEffect(() => {
    setCategoryId("");
  }, [txKind]);

  const categoryOptions =
    txKind === "INCOME"
      ? incomeTypes.map((item) => ({ value: item.id, label: item.name }))
      : expenseTypes.map((item) => ({ value: item.id, label: item.name }));

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!companyId) nextErrors.companyId = "Company is required.";
    if (!paymentMode) nextErrors.paymentMode = "Payment mode is required.";
    if (!receivedById) nextErrors.receivedById = "User is required.";
    if (!categoryId) {
      nextErrors.categoryId =
        txKind === "INCOME"
          ? "Income source is required."
          : "Expense type is required.";
    }
    if (!projectId) nextErrors.projectId = "Project is required.";
    if (!amount.trim() || Number(amount) <= 0) {
      nextErrors.amount = "Amount is required.";
    }
    if (!date.trim()) nextErrors.date = "Date is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const remark = buildRemark({
      remarks,
      billNo,
      vendor,
      bankResource,
      projectRef,
    });

    try {
      setSaving(true);
      if (txKind === "INCOME") {
        await incomeApi.create({
          incomeTypeId: categoryId,
          projectId,
          incomeCompanyId: companyId,
          receivedById,
          amount,
          paymentMode,
          date,
          remark,
        });
      } else {
        await dailyExpenseApi.create({
          transactionType: "EXPENSE",
          amount,
          projectId,
          expenseTypeId: categoryId,
          expenseById: receivedById,
          expenseCompanyId: companyId,
          paymentMode,
          date,
          remark,
        });
      }

      toast.success("Direct entry saved successfully.");
      setAmount("");
      setVendor("");
      setRemarks("");
      setBillNo("");
      setProjectRef("");
      setPhotoName("");
      setDate(getTodayInputDate());
      onSaved();
    } catch (error) {
      console.error("Failed to save direct entry", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save direct entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormCard title="Direct Expense (White)" subtitle="Bank payment entry">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Company</FieldLabel>
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
              <FieldLabel>Bank Resource</FieldLabel>
              <SelectInput
                value={bankResource}
                onChange={setBankResource}
                options={BANK_RESOURCES.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Payment Mode</FieldLabel>
              <SelectInput
                value={paymentMode}
                onChange={(value) => setPaymentMode(value as PaymentMode)}
                options={bankPaymentModes.map((item) => ({
                  value: item.key,
                  label: item.label,
                }))}
                error={errors.paymentMode}
              />
            </div>
            <div>
              <FieldLabel>Vendor</FieldLabel>
              <TextInput
                value={vendor}
                onChange={setVendor}
                placeholder="Vendor name"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Transaction</FieldLabel>
            <IncomeExpenseToggle value={txKind} onChange={setTxKind} />
          </div>

          <div>
            <FieldLabel>
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

          <div>
            <FieldLabel>
              {txKind === "INCOME" ? "Received By" : "Expense By"}
            </FieldLabel>
            <SelectInput
              value={receivedById}
              onChange={setReceivedById}
              options={custodians.map((item) => ({
                value: item.id,
                label: getUserDisplayName(item),
              }))}
              error={errors.receivedById}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Amount</FieldLabel>
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
              <FieldLabel>Date</FieldLabel>
              <DateField value={date} onChange={setDate} error={errors.date} />
            </div>
          </div>

          <div>
            <FieldLabel>Project</FieldLabel>
            <SelectInput
              value={projectId}
              onChange={setProjectId}
              options={projects.map((item) => ({
                value: item.id,
                label: item.city ? `${item.name} (${item.city})` : item.name,
              }))}
              placeholder="Select project"
              error={errors.projectId}
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
        defaultSourceFilter="directWhite"
      />
    </div>
  );
}
