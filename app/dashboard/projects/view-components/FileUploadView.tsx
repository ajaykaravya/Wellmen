"use client";

import { FaDownload, FaFilePdf, FaFileWord } from "react-icons/fa";

type UploadedFile = {
  url: string;
  name: string;
  size: number | null;
  fileType: "PDF" | "DOC";
};

function formatSize(bytes: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadView({
  section,
  formData,
}: {
  section: any;
  formData: any;
}) {
  const files: UploadedFile[] = Array.isArray(formData?.[section.key])
    ? formData[section.key]
    : [];

  if (files.length === 0) return null;

  return (
    <div className="rbac-card">
      <h3 className="rbac-title-lg mb-4">{section.title}</h3>

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
            <a
              href={file.url}
              download={file.name}
              className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label={`Download ${file.name}`}
            >
              <FaDownload size={12} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
