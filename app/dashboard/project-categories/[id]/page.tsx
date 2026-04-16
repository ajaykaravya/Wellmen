"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import CategoryFormContent from "../_components/CategoryFormContent";

export default function CategoryEditPage() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!categoryId || typeof categoryId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <CategoryFormContent categoryId={categoryId} />
    </DashboardShell>
  );
}
