"use client";

import DashboardShell from "../../../_components/DashboardShell";
import BoleroDeliveryLogFormContent from "../_components/BoleroDeliveryLogFormContent";

export default function BoleroDeliveryLogNewPage() {
  return (
    <DashboardShell requireAdmin>
      <BoleroDeliveryLogFormContent />
    </DashboardShell>
  );
}
