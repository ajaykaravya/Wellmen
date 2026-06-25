"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import ViewRenderer from "../../../view-components/ViewRenderer";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import Loading from "@/app/components/Loading";

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSubmission = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/project-form-submission/${submissionId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch submission");
      }
      const result = await res.json();
      setData(result.data);
    } catch (error) {
      console.error("Submission fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId, loadSubmission]);

  const handleBack = () => {
    if (data?.project?.id) {
      router.push(`/dashboard/projects/forms?projectId=${data.project.id}`);
    } else {
      router.back();
    }
  };

  const handleSavePDF = async () => {
    if (!contentRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(contentRef.current, {
        quality: 1,
        backgroundColor: "#ffffff",
        filter: (node: any) => {
          // Hide elements with 'print:hidden' class or buttons that shouldn't be in PDF
          if (node.classList?.contains("print:hidden")) return false;
          return true;
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const imgHeight = (img.height * pdfWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${data.projectForm.name}_${data.project.name}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-80 flex items-center justify-center">
          <Loading />
        </div>
      </DashboardShell>
    );
  }

  if (!data) {
    return <DashboardShell>Submission not found.</DashboardShell>;
  }

  return (
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card" ref={contentRef}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.projectForm.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Project:{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {data.project.name}
                </span>
              </p>
            </div>
            <div className="flex gap-3 print:hidden">
              <button
                onClick={handleSavePDF}
                className="rbac-button rbac-button-secondary bg-gray-50 hover:bg-gray-100"
              >
                Save as PDF
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/projects/forms/${submissionId}`)
                }
                className="rbac-button"
              >
                Edit Submission
              </button>
            </div>
          </div>

          <ViewRenderer
            template={data.projectForm.template}
            formData={data.formData}
            onBack={handleBack}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
