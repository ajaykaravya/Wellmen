"use client";

import DashboardShell from "../../_components/DashboardShell";
import UserFormContent from "../_components/UserFormContent";

export default function NewUserPage() {
  return (
    <DashboardShell requireAdmin>
      <UserFormContent />
    </DashboardShell>
  );
}
