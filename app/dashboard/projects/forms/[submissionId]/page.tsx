"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import FormRenderer from "../../form-components/FormRenderer";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/Loading";

export default function ProjectFormPage() {
  const params = useParams();
  const router = useRouter();

  const submissionId = params.submissionId as string;

  const [data, setData] = useState<any>(null);

  const [formData, setFormData] = useState<any>({});

  const loadSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/project-form-submission/${submissionId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch submission");
      }

      const result = await res.json();

      setData(result.data);

      // existing saved JSON
      setFormData(result.data?.formData || {});
    } catch (error) {
      console.error("Submission fetch error:", error);
    }
  }, [submissionId]);

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId, loadSubmission]);

  if (!data) {
    return (
      <DashboardShell>
        <div className="min-h-80 flex items-center justify-center">
          <Loading />
        </div>
      </DashboardShell>
    );
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/project-form-submission/${submissionId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          formData,
        }),
      });

      if (res.ok) {
        // Navigate back to project forms list
        router.push(`/dashboard/projects/forms?projectId=${data.project.id}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const hadnleBack = () => {
    router.push(`/dashboard/projects/forms?projectId=${data.project.id}`);
  };

  return (
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex gap-4 mb-2">
            <h2>Project: {data.project.name}</h2>
            <h3>Form: {data.projectForm.name}</h3>
          </div>

          <FormRenderer
            template={data.projectForm.template}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onBack={hadnleBack}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
