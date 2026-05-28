"use client";

import { useSearchParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import PetiCashFormContent from "../_components/PetiCashFormContent";

export default function PetiCashNewPage() {
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode") === "DEBIT" ? "DEBIT" : "CREDIT";

  return (
    <DashboardShell requireAdmin>
      <PetiCashFormContent defaultTransactionType={mode} />
    </DashboardShell>
  );
}
