"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import FormRenderer from "../../form-components/FormRenderer";

export default function ProjectFormPage() {

    const params = useParams();
    const submissionId = params.submissionId as string;
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const res = await fetch(
                `/api/project-form-submission/${submissionId}`
            );
            const result = await res.json();
            setData(result.data);
        }
        if (submissionId) {
            load();
        }
    }, [submissionId]);

    if (!data) {
        return (
            <DashboardShell>
                Loading...
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <section className="rbac-section rbac-container">
                <div className="rbac-card">
                    <h2>
                        {data.project.name}
                    </h2>
                    <h3>
                        {data.projectForm.name}
                    </h3>
                    <FormRenderer

                        template={
                            data.projectForm.template
                        }


                        formData={
                            data.formData
                        }

                    />
                </div>
            </section>
        </DashboardShell>

    );
}