"use client";

import { useRef, useState } from "react";
import { FaDownload, FaFilePdf, FaFileWord, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

type UploadedFile = {
  url: string;
  name: string;
  size: number | null;
  fileType: "PDF" | "DOC";
  uploadedAt?: string;
};

function formatSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadSection({
  section,
  formData,
  setFormData,
  projectId,
}: {
  section: any;
  formData: any;
  setFormData: any;
  projectId?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const files: UploadedFile[] = Array.isArray(formData?.[section.key])
    ? formData[section.key]
    : [];

  const accept = section.accept || ".pdf,.doc,.docx";

  const handleFiles = async (fileList: FileList | null) => {
    const selected = Array.from(fileList || []);
    if (selected.length === 0) return;

    if (!projectId) {
      toast.error("Project could not be identified for this upload.");
      return;
    }

    const body = new FormData();
    selected.forEach((file) => body.append("files", file));

    try {
      setUploading(true);
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to upload document.");
      }

      const uploaded: UploadedFile[] = payload?.data || [];
      setFormData((prev: any) => ({
        ...prev,
        [section.key]: [...(prev?.[section.key] || []), ...uploaded],
      }));
      toast.success(
        uploaded.length === 1
          ? "Document uploaded."
          : `${uploaded.length} documents uploaded.`,
      );
    } catch (error) {
      console.error("Failed to upload document", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [section.key]: (prev?.[section.key] || []).filter(
        (_: UploadedFile, i: number) => i !== index,
      ),
    }));
  };

  return (
    <div className="rbac-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="rbac-title-lg">{section.title}</h3>
          {section.description ? (
            <p className="text-xs text-slate-500">{section.description}</p>
          ) : null}
        </div>

        <label
          className={`cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading ? "Uploading..." : "+ Upload Document"}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No documents uploaded yet. PDF, DOC and DOCX files are accepted.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                {file.fileType === "DOC" ? (
                  <FaFileWord className="shrink-0 text-sky-700" size={16} />
                ) : (
                  <FaFilePdf className="shrink-0 text-rose-600" size={16} />
                )}
                <span className="truncate text-xs font-medium text-slate-800">
                  {file.name}
                </span>
                {formatSize(file.size) ? (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                    {formatSize(file.size)}
                  </span>
                ) : null}
              </a>

              <div className="flex shrink-0 items-center gap-0.5">
                <a
                  href={file.url}
                  download={file.name}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label={`Download ${file.name}`}
                >
                  <FaDownload size={12} />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
