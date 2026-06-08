"use client";

import Image from "next/image";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { FaPlay, FaSpinner } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import { MdOutlineFileDownload } from "react-icons/md";
import { formatToDDMMYYYY } from "@/lib/dateUtils";
import { useDashboardContext } from "./DashboardShell";

type ReportDetailsDialogRow = {
  reportDate: string;
  projectName: string;
  projectCity?: string | null;
  categoryName?: string | null;
  description?: string | null;
  imageUrls?: string[];
  videoUrls?: string[];
  videoUrl?: string | null;
  createdByName?: string | null;
};

type ReportDetailsDialogProps<T extends ReportDetailsDialogRow> = {
  open: boolean;
  loading: boolean;
  report: T | null;
  showEmployee?: boolean;
  viewImageUrls: string[];
  viewVideoUrls: string[];
  onClose: () => void;
  onOpenImage: (index: number) => void;
  onOpenVideo: (index: number) => void;
};

export function ReportDetailsDialog<T extends ReportDetailsDialogRow>({
  open,
  loading,
  report,
  showEmployee = false,
  viewImageUrls,
  viewVideoUrls,
  onClose,
  onOpenImage,
  onOpenVideo,
}: ReportDetailsDialogProps<T>) {
  const { isAdmin } = useDashboardContext();

  if (!open) {
    return null;
  }

  const mediaUrls = report
    ? report.videoUrls && report.videoUrls.length > 0
      ? report.videoUrls
    : report.videoUrl
    ? [report.videoUrl]
    : []
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      <DialogBackdrop
        className="theme-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <DialogPanel className="theme-modal-surface relative w-full max-w-4xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-auto">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-semibold">Report details</DialogTitle>
            <button type="button" onClick={onClose} aria-label="Close report details">
              <IoIosClose size={30} />
            </button>
          </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin mr-2" size={16} />
          </div>
        )}

        {!loading && report && (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <p className="text-sm">
                <strong>Date:</strong> {formatToDDMMYYYY(report.reportDate)}
              </p>
              <p className="text-sm">
                <strong>Project:</strong> {report.projectName}
                <span className="text-slate-500"> ({report.projectCity || "-"})</span>
              </p>
              {showEmployee && isAdmin && (
                <p className="text-sm">
                  <strong>Employee:</strong> {report.createdByName || "-"}
                </p>
              )}
              <p className="text-sm">
                <strong>Reporting Category:</strong> {report.categoryName || "-"}
              </p>
            </div>

            <p className="text-sm whitespace-pre-wrap">
              <strong>Description:</strong> {report.description || "-"}
            </p>

            {viewImageUrls.length ? (
              <div>
                <p className="text-sm font-semibold">Images</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {viewImageUrls.map((url, index) => (
                    <div
                      key={url}
                      className="rounded-xl border p-2"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => onOpenImage(index)}
                      >
                        <Image
                          src={url}
                          alt={`Report image ${index + 1}`}
                          width={640}
                          height={320}
                          unoptimized
                          className="h-40 w-full rounded-lg object-cover transition-transform duration-200 hover:scale-[1.01]"
                        />
                      </button>
                      <a className="rbac-link mt-2 inline-block" href={url} download>
                        <MdOutlineFileDownload size={25} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {mediaUrls.length ? (
              <div>
                <p className="text-sm font-semibold">Video</p>
                <div
                  className="mt-2 rounded-xl border p-3"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  <div className="grid gap-3">
                    {viewVideoUrls.map((url, index) => (
                      <div key={url}>
                        <button
                          type="button"
                          className="group relative block w-full overflow-hidden rounded-lg theme-surface-2"
                          onClick={() => onOpenVideo(index)}
                          aria-label={`Open video ${index + 1}`}
                        >
                          <video
                            className="h-48 w-full object-cover"
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                              <FaPlay className="ml-1" size={18} />
                            </span>
                          </div>
                        </button>
                        <a className="rbac-link mt-2 inline-block" href={url} download>
                          <MdOutlineFileDownload size={25} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogPanel>
      </div>
    </Dialog>
  );
}
