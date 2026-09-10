"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/app/dashboard/_components/DashboardShell";
import ViewRenderer from "../../../view-components/ViewRenderer";
import jsPDF from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import * as htmlToImage from "html-to-image";
import Loading from "@/app/components/Loading";
import {
  loadPrimaryCompany,
  type CompanyDetails,
} from "@/lib/api/dashboard/companies";
import { migrateFormData } from "@/lib/sectionFormKeys";

// Width the document is rendered at for PDF export. Independent of the
// browser window so exports are consistent, and wide enough for the widest
// table in the view components.
const PDF_CAPTURE_WIDTH = 1000;

// The app sizes its type in rem, so raising the root font size for the
// duration of the capture enlarges every label and table cell without
// narrowing the capture width (which would clip the min-w-[900px] tables).
const PDF_ROOT_FONT_SIZE = "19px";

// Height reserved at the bottom of every page for the company footer (mm).
const PDF_FOOTER_BAND = 26;

// Side/top margin for placed blocks (mm).
const PDF_MARGIN = 5;

// Applied only while capturing. Kills the horizontal scrollbars that
// overflow-x-auto draws into the image, and lets wide tables wrap to the page
// instead of scrolling, so nothing is cut off at the right edge.
const PDF_EXPORT_CSS = `
[data-pdf-exporting] * { overflow: visible !important; }
[data-pdf-exporting] table { min-width: 0 !important; width: 100% !important; table-layout: auto !important; }
[data-pdf-exporting] th, [data-pdf-exporting] td {
  word-break: break-word !important;
  white-space: normal !important;
  min-width: 0 !important;
}
`;

// Android's WebView ignores blob: downloads and <a download>, so jsPDF's
// save() silently does nothing inside the Capacitor app. On native the file is
// written to the device and handed to the share sheet instead.
async function savePdf(pdf: InstanceType<typeof jsPDF>, fileName: string) {
  if (!Capacitor.isNativePlatform()) {
    pdf.save(fileName);
    return;
  }

  const dataUri = pdf.output("datauristring");
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);

  const written = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  try {
    await Share.share({
      title: fileName,
      url: written.uri,
      dialogTitle: "Save or share PDF",
    });
  } catch {
    // Dismissing the share sheet rejects; the file is already written, so
    // this is not a failure.
  }
}

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
    const baseY = pageHeight - 21;

    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);

      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, baseY - 5, pdfWidth - marginX, baseY - 5);

      let textX = marginX;
      if (logoData) {
        try {
          pdf.addImage(logoData, "PNG", marginX, baseY - 3, 11, 11);
          textX = marginX + 14;
        } catch {
          // An unsupported image simply means a text-only footer.
        }
      }

      if (line1) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(60);
        pdf.text(line1, textX, baseY);
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(110);

      const maxWidth = pdfWidth - textX - marginX - 20;
      if (line2) {
        pdf.text(pdf.splitTextToSize(line2, maxWidth)[0] || "", textX, baseY + 5.0);
      }
      if (line3) {
        pdf.text(pdf.splitTextToSize(line3, maxWidth)[0] || "", textX, baseY + 10.0);
      }

      pdf.setFontSize(11);
      pdf.setTextColor(140);
      pdf.text(
        `Page ${page} of ${pageCount}`,
        pdfWidth - marginX,
        baseY + 10.0,
        { align: "right" },
      );
    }

    pdf.setTextColor(0);
  };

  const handleSavePDF = async () => {
    if (!contentRef.current) return;

    const node = contentRef.current;
    const root = document.documentElement;
    const previousWidth = node.style.width;
    const previousRootFontSize = root.style.fontSize;

    // Injected rather than kept in the stylesheet so it only ever affects the
    // export, never the on-screen view.
    const styleTag = document.createElement("style");
    styleTag.textContent = PDF_EXPORT_CSS;

    try {
      node.style.width = `${PDF_CAPTURE_WIDTH}px`;
      root.style.fontSize = PDF_ROOT_FONT_SIZE;
      node.setAttribute("data-pdf-exporting", "");
      document.head.appendChild(styleTag);

      const blocks: HTMLElement[] = [];
      node
        .querySelectorAll<HTMLElement>("[data-pdf-block]")
        .forEach((el) => blocks.push(el));
      node
        .querySelectorAll<HTMLElement>("[data-pdf-sections] > *")
        .forEach((el) => blocks.push(el));

      const targets = blocks.length > 0 ? blocks : [node];

      type Captured = {
        img: HTMLImageElement;
        // Offsets (image px) where the block may be cut without slicing
        // through a table row.
        breakpoints: number[];
      };

      const captured: Captured[] = [];

      for (const block of targets) {
        if (block.classList.contains("print:hidden")) continue;

        const blockRect = block.getBoundingClientRect();
        if (!blockRect.height) continue;

        const dataUrl = await htmlToImage.toPng(block, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          filter: (child: any) => !child.classList?.contains("print:hidden"),
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));
        if (!img.width || !img.height) continue;

        // Row bottoms become the legal cut points, so a page break lands
        // between rows instead of through one.
        const pxPerCss = img.height / blockRect.height;
        const breakpoints = new Set<number>([0, img.height]);
        block.querySelectorAll("tr").forEach((tr) => {
          const bottom =
            (tr.getBoundingClientRect().bottom - blockRect.top) * pxPerCss;
          if (bottom > 0 && bottom < img.height) breakpoints.add(bottom);
        });

        captured.push({
          img,
          breakpoints: [...breakpoints].sort((a, b) => a - b),
        });
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pdfWidth - PDF_MARGIN * 2;
      const contentBottom = pageHeight - PDF_FOOTER_BAND;

      // Cuts a horizontal band out of the captured image so each page gets
      // exactly the rows that fit on it.
      const sliceToDataUrl = (
        img: HTMLImageElement,
        fromPx: number,
        toPx: number,
      ) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = Math.max(1, Math.round(toPx - fromPx));
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          0,
          fromPx,
          img.width,
          canvas.height,
          0,
          0,
          img.width,
          canvas.height,
        );
        return canvas.toDataURL("image/png");
      };

      let cursorY = PDF_MARGIN;

      for (const block of captured) {
        const mmPerPx = contentWidth / block.img.width;
        let startPx = 0;

        while (startPx < block.img.height - 1) {
          const availableMm = contentBottom - cursorY;
          const availablePx = availableMm / mmPerPx;

          // Largest row boundary that still fits the space left on this page.
          let cutPx = 0;
          for (const bp of block.breakpoints) {
            if (bp > startPx && bp - startPx <= availablePx) cutPx = bp;
          }

          if (cutPx === 0) {
            // Nothing fits here. Move to a fresh page unless the page is
            // already empty, in which case the row itself is taller than a
            // page and has to be cut mid-row.
            if (cursorY > PDF_MARGIN) {
              pdf.addPage();
              cursorY = PDF_MARGIN;
              continue;
            }
            cutPx = Math.min(block.img.height, startPx + availablePx);
          }

          const sliceUrl = sliceToDataUrl(block.img, startPx, cutPx);
          if (!sliceUrl) break;

          const sliceHeightMm = (cutPx - startPx) * mmPerPx;
          pdf.addImage(
            sliceUrl,
            "PNG",
            PDF_MARGIN,
            cursorY,
            contentWidth,
            sliceHeightMm,
          );
          cursorY += sliceHeightMm;
          startPx = cutPx;

          if (startPx < block.img.height - 1) {
            pdf.addPage();
            cursorY = PDF_MARGIN;
          }
        }

        cursorY += 4;
      }

      await drawFooterOnEveryPage(pdf, pdfWidth, pageHeight);
      await savePdf(
        pdf,
        `${data.project.name} - ${data.projectForm.name}.pdf`,
      );
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      node.removeAttribute("data-pdf-exporting");
      styleTag.remove();
      node.style.width = previousWidth;
      root.style.fontSize = previousRootFontSize;
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
          <div
            data-pdf-block
            className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b"
          >
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
