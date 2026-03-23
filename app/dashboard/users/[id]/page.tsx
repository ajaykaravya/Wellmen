"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import UserFormContent from "../_components/UserFormContent";

export default function EditUserPage() {
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!userId || typeof userId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <UserFormContent userId={userId} />
    </DashboardShell>
  );
}
