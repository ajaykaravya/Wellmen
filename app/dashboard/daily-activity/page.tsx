"use client";

import { Suspense } from "react";
import DashboardShell from "../_components/DashboardShell";
import DailyActivityContent from "./_components/DailyActivityContent";

export default function DailyActivityPage() {
  return (
    <DashboardShell requireAdmin>
      <Suspense fallback={null}>
        <DailyActivityContent />
      </Suspense>
    </DashboardShell>
  );
}
