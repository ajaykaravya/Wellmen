"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import OfficeCategoryFormContent from "../_components/OfficeCategoryFormContent";

export default function OfficeCategoryEditPage() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!categoryId || typeof categoryId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <OfficeCategoryFormContent categoryId={categoryId} />
    </DashboardShell>
  );
}
