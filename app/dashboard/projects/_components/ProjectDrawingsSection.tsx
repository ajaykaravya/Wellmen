"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaTrash,
} from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { toast } from "react-toastify";
import {
  deleteProjectDrawing,
  loadDrawingCategories,
  loadProjectDrawings,
  uploadProjectDrawings,
  type DrawingCategoryOption,
  type DrawingFileType,
  type ProjectDrawing,
} from "@/lib/api/dashboard/project-drawings";

const ACCEPT = ".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.dwg,.dxf";

const FILE_TYPE_LABEL: Record<DrawingFileType, string> = {
  PDF: "PDF",
  PPT: "PPT",
  IMAGE: "Image",
  AUTOCAD: "AutoCAD",
};

function FileTypeIcon({ fileType }: { fileType: DrawingFileType }) {
  if (fileType === "PDF")
    return <FaFilePdf className="text-rose-600" size={16} />;
  if (fileType === "PPT")
    return <FaFilePowerpoint className="text-orange-600" size={16} />;
  if (fileType === "IMAGE")
    return <FaFileImage className="text-emerald-600" size={16} />;
  return <FaFileAlt className="text-sky-700" size={16} />;
}

function formatSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Browsers can render images and PDFs inline. PowerPoint and AutoCAD have no
// native renderer, so those are offered as downloads instead.
const canPreviewInline = (fileType: DrawingFileType) =>
  fileType === "IMAGE" || fileType === "PDF";

export default function ProjectDrawingsSection({
  projectId,
}: {
  projectId: string;
}) {
  const [categories, setCategories] = useState<DrawingCategoryOption[]>([]);
  const [drawings, setDrawings] = useState<ProjectDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ProjectDrawing | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [categoryRows, drawingRows] = await Promise.all([
        loadDrawingCategories(),
        loadProjectDrawings(projectId),
      ]);
      setCategories(categoryRows || []);
      setDrawings(drawingRows || []);
    } catch (error) {
      console.error("Failed to load project drawings", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load drawings.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const byCategory = useMemo(() => {
    const map: Record<string, ProjectDrawing[]> = {};
    drawings.forEach((drawing) => {
      (map[drawing.drawingCategoryId] ||= []).push(drawing);
    });
    return map;
  }, [drawings]);

  const handleFiles = async (categoryId: string, fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    try {
      setUploadingId(categoryId);
      await uploadProjectDrawings(projectId, categoryId, files);
      toast.success(
        files.length === 1
          ? "Drawing uploaded."
          : `${files.length} drawings uploaded.`,
      );
      await load();
    } catch (error) {
      console.error("Failed to upload drawing", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload drawing.",
      );
    } finally {
      setUploadingId(null);
      const input = inputRefs.current[categoryId];
      if (input) input.value = "";
    }
  };

  const handleDelete = async (drawing: ProjectDrawing) => {
    try {
      await deleteProjectDrawing(projectId, drawing.id);
      setDrawings((prev) => prev.filter((item) => item.id !== drawing.id));
      toast.success("Drawing removed.");
    } catch (error) {
      console.error("Failed to remove drawing", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove drawing.",
      );
    }
  };

  return (
    <section className="rbac-section rbac-container">
      <div className="mb-3">
        <h3 className="rbac-title-lg">Drawings</h3>
        <p className="text-xs text-slate-500">
          Upload PDF, PPT, JPG/PNG or AutoCAD (.dwg/.dxf) files against each
          drawing category. Any or all formats may be uploaded.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Loading drawings...
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const rows = byCategory[category.id] || [];
            const busy = uploadingId === category.id;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900">
                    {category.name}
                    <span className="ml-2 text-xs font-medium text-slate-400">
                      {rows.length === 0
                        ? "No files"
                        : `${rows.length} file${rows.length > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  <label
                    className={`cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 ${
                      busy ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {busy ? "Uploading..." : "+ Upload"}
                    <input
                      ref={(el) => {
                        inputRefs.current[category.id] = el;
                      }}
                      type="file"
                      multiple
                      accept={ACCEPT}
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => handleFiles(category.id, e.target.files)}
                    />
                  </label>
                </div>

                {rows.length > 0 ? (
                  <ul className="space-y-1.5">
                    {rows.map((drawing) => (
                      <li
                        key={drawing.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => setViewing(drawing)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          title={`View ${drawing.fileName}`}
                        >
                          {drawing.fileType === "IMAGE" ? (
                            <Image
                              src={drawing.fileUrl}
                              alt={drawing.fileName}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-8 w-8 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <FileTypeIcon fileType={drawing.fileType} />
                          )}
                          <span className="truncate text-xs font-medium text-slate-800">
                            {drawing.fileName}
                          </span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                            {FILE_TYPE_LABEL[drawing.fileType]}
                            {formatSize(drawing.fileSize)
                              ? ` · ${formatSize(drawing.fileSize)}`
                              : ""}
                          </span>
                        </button>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setViewing(drawing)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                            aria-label={`View ${drawing.fileName}`}
                          >
                            <FaEye size={12} />
                          </button>
                          <a
                            href={drawing.fileUrl}
                            download={drawing.fileName}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                            aria-label={`Download ${drawing.fileName}`}
                          >
                            <FaDownload size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(drawing)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Remove ${drawing.fileName}`}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        className="relative z-60"
      >
        <div className="theme-modal-overlay fixed inset-0" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
          <DialogPanel className="theme-modal-surface w-full max-w-5xl rounded-2xl p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold theme-text">
                  {viewing?.fileName}
                </p>
                <p className="text-xs theme-text-muted">
                  {viewing ? FILE_TYPE_LABEL[viewing.fileType] : ""}
                  {viewing?.categoryName ? ` · ${viewing.categoryName}` : ""}
                  {viewing && formatSize(viewing.fileSize)
                    ? ` · ${formatSize(viewing.fileSize)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full p-1 transition theme-text-muted hover:bg-black/5"
                aria-label="Close preview"
              >
                <IoIosClose size={30} />
              </button>
            </div>

            <div className="flex items-center justify-center rounded-xl theme-surface-2 p-2">
              {viewing && viewing.fileType === "IMAGE" ? (
                <Image
                  src={viewing.fileUrl}
                  alt={viewing.fileName}
                  width={1400}
                  height={900}
                  unoptimized
                  className="max-h-[72vh] w-full max-w-full rounded-xl object-contain"
                />
              ) : null}

              {viewing && viewing.fileType === "PDF" ? (
                <iframe
                  src={viewing.fileUrl}
                  title={viewing.fileName}
                  className="h-[72vh] w-full rounded-xl border-0 bg-white"
                />
              ) : null}

              {viewing && !canPreviewInline(viewing.fileType) ? (
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                  <FileTypeIcon fileType={viewing.fileType} />
                  <p className="text-sm font-semibold theme-text">
                    {FILE_TYPE_LABEL[viewing.fileType]} files cannot be
                    previewed in the browser.
                  </p>
                  <p className="max-w-sm text-xs theme-text-muted">
                    Download the file and open it in{" "}
                    {viewing.fileType === "AUTOCAD"
                      ? "AutoCAD or a DWG/DXF viewer"
                      : "PowerPoint"}
                    .
                  </p>
                  <a
                    href={viewing.fileUrl}
                    download={viewing.fileName}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-800"
                  >
                    <FaDownload size={13} />
                    Download
                  </a>
                </div>
              ) : null}
            </div>

            {viewing && canPreviewInline(viewing.fileType) ? (
              <div className="flex justify-end px-2 pt-3">
                <a
                  href={viewing.fileUrl}
                  download={viewing.fileName}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold theme-text transition hover:bg-black/5"
                >
                  <FaDownload size={12} />
                  Download
                </a>
              </div>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </section>
  );
}
