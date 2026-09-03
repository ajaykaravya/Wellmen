"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import ViewRenderer from "../../../view-components/ViewRenderer";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import Loading from "@/app/components/Loading";
import {
  loadPrimaryCompany,
  type CompanyDetails,
} from "@/lib/api/dashboard/companies";
import { migrateFormData } from "@/lib/sectionFormKeys";

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [primaryCompany, setPrimaryCompany] = useState<CompanyDetails | null>(
    null,
  );

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

  useEffect(() => {
    // Printed as a footer on every PDF page; absence is not an error.
    loadPrimaryCompany()
      .then(setPrimaryCompany)
      .catch((error) => console.error("Failed to load primary company", error));
  }, []);

  const handleBack = () => {
    if (data?.project?.id) {
      router.push(`/dashboard/projects/forms?projectId=${data.project.id}`);
    } else {
      router.back();
    }
  };

  // Loads an image as a data URL so jsPDF can embed it. Returns null rather
  // than throwing, so a missing logo never blocks the export.
  const toDataUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const drawFooterOnEveryPage = async (
    pdf: InstanceType<typeof jsPDF>,
    pdfWidth: number,
    pageHeight: number,
  ) => {
    const company = primaryCompany;
    // jspdf 4 declares getNumberOfPages() on the instance, but the obsolete
    // @types/jspdf@1 stub in devDependencies shadows it, so narrow the cast
    // here rather than reach into pdf.internal.
    const pageCount = (
      pdf as unknown as { getNumberOfPages(): number }
    ).getNumberOfPages();

    const line1 = company?.name || "";
    const line2 = [company?.address].filter(Boolean).join("");
    const line3 = [
      company?.contactPerson ? `Contact: ${company.contactPerson}` : "",
      company?.contactNumber,
      company?.email,
    ]
      .filter(Boolean)
      .join("  |  ");

    const logoData =
      company?.logoUrl ? await toDataUrl(company.logoUrl) : null;

    const marginX = 10;
    const baseY = pageHeight - 16;

    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);

      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, baseY - 4, pdfWidth - marginX, baseY - 4);

      let textX = marginX;
      if (logoData) {
        try {
          pdf.addImage(logoData, "PNG", marginX, baseY - 2, 10, 10);
          textX = marginX + 13;
        } catch {
          // An unsupported image simply means a text-only footer.
        }
      }

      if (line1) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(60);
        pdf.text(line1, textX, baseY);
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(110);

      const maxWidth = pdfWidth - textX - marginX - 20;
      if (line2) {
        pdf.text(pdf.splitTextToSize(line2, maxWidth)[0] || "", textX, baseY + 3.5);
      }
      if (line3) {
        pdf.text(pdf.splitTextToSize(line3, maxWidth)[0] || "", textX, baseY + 7);
      }

      pdf.setFontSize(7);
      pdf.setTextColor(140);
      pdf.text(
        `Page ${page} of ${pageCount}`,
        pdfWidth - marginX,
        baseY + 7,
        { align: "right" },
      );
    }

    pdf.setTextColor(0);
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

      await drawFooterOnEveryPage(pdf, pdfWidth, pageHeight);

      pdf.save(`${data.project.name} - ${data.projectForm.name}.pdf`);
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

  const projectAddress = [data.project.address, data.project.city]
    .filter(Boolean)
    .join(", ");

  const printedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card" ref={contentRef}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.projectForm.name}
              </h1>

              {/* Project details are printed with the document so a shared or
                  filed PDF identifies the hospital on its own. */}
              <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-gray-500">Hospital:</dt>
                  <dd className="font-semibold">{data.project.name}</dd>
                </div>

                {projectAddress ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500">Address:</dt>
                    <dd>{projectAddress}</dd>
                  </div>
                ) : null}

                {data.project.contactNumber ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500">Contact:</dt>
                    <dd>{data.project.contactNumber}</dd>
                  </div>
                ) : null}

                {data.project.email ? (
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500">Email:</dt>
                    <dd>{data.project.email}</dd>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <dt className="shrink-0 text-gray-500">Status:</dt>
                  <dd>
                    {data.status === "COMPLETED" ? "Completed" : "Pending"}
                  </dd>
                </div>

                <div className="flex gap-2">
                  <dt className="shrink-0 text-gray-500">Printed:</dt>
                  <dd>{printedOn}</dd>
                </div>
              </dl>
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
            formData={migrateFormData(
              data.formData || {},
              data.projectForm.template,
            )}
            onBack={handleBack}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
