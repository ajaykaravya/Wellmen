"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ServiceCategoryFormContent from "../_components/ServiceCategoryFormContent";

export default function ServiceCategoryEditPage() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!categoryId || typeof categoryId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ServiceCategoryFormContent categoryId={categoryId} />
    </DashboardShell>
  );
}
