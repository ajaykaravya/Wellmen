"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import DashboardShell from "../../../_components/DashboardShell";
import ProjectDrawingsSection from "../../_components/ProjectDrawingsSection";
import { projectsApi } from "@/lib/api/dashboard/projects";

export default function ProjectDrawingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    if (!projectId || typeof projectId !== "string") return;
    let cancelled = false;

    projectsApi
      .get(projectId)
      .then((project) => {
        if (cancelled) return;
        const row = project as { name?: string; city?: string | null };
        if (row?.name) {
          setProjectName(row.city ? `${row.name} (${row.city})` : row.name);
        }
      })
      .catch((error) => {
        console.error("Failed to load project", error);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!projectId || typeof projectId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <div className="rbac-container mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/projects")}
          className="rbac-link flex items-center gap-2 text-sm font-semibold"
        >
          <FaArrowLeft size={14} />
          Projects
        </button>
        {projectName ? (
          <span className="text-sm text-slate-500">/ {projectName}</span>
        ) : null}
      </div>

      <ProjectDrawingsSection projectId={projectId} />
    </DashboardShell>
  );
}
