"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import TodoFormContent from "../_components/TodoFormContent";

export default function TodoEditPage() {
  const params = useParams();
  const todoId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!todoId || typeof todoId !== "string") return null;

  return (
    <DashboardShell>
      <TodoFormContent todoId={todoId} />
    </DashboardShell>
  );
}
