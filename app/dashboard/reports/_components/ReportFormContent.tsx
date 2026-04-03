"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDashboardContext } from "../../_components/DashboardShell";
import Link from "next/link";

type ReportStatus = "TODO" | "IN_PROGRESS" | "DONE" | "ON_HOLD";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type ReportPayload = {
  id: string;
  reportDate: string;
  projectId: string;
  title: string;
  description: string;
  status: ReportStatus;
  imageUrls: string[];
  videoUrl: string | null;
};

type ReportFormState = {
  reportDate: string;
  projectId: string;
  title: string;
  description: string;
  status: ReportStatus;
};

type ReportFormContentProps = {
  reportId?: string;
};

const getTodayInputDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function ReportFormContent({ reportId }: ReportFormContentProps) {
  const router = useRouter();
  const { setNavOpen, isAdmin } = useDashboardContext();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ReportFormState, string>>>({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [form, setForm] = useState<ReportFormState>({
    reportDate: getTodayInputDate(),
    projectId: "",
    title: "",
    description: "",
    status: "TODO",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, reportRes] = await Promise.all([
          fetch("/api/projects/options"),
          reportId ? fetch(`/api/reports/${reportId}`) : Promise.resolve(null),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const rows = Array.isArray(data) ? data : [];
          setProjects(rows);
          setForm((prev) => ({
            ...prev,
            projectId: prev.projectId || rows[0]?.id || "",
          }));
        }

        if (reportRes) {
          if (!reportRes.ok) {
            setNote("Failed to load reporting details.");
          } else {
            const report = (await reportRes.json()) as ReportPayload;
            setForm({
              reportDate: formatDateForInput(report.reportDate),
              projectId: report.projectId || "",
              title: report.title || "",
              description: report.description || "",
              status: report.status || "TODO",
            });
            setExistingImages(Array.isArray(report.imageUrls) ? report.imageUrls : []);
            setExistingVideoUrl(report.videoUrl || null);
          }
        }
      } catch (error) {
        console.error("Failed to load report form data", error);
        setNote("Failed to load reporting form.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportId]);

  const isCreateBlocked = isAdmin && !reportId;

  const canSubmit = useMemo(
    () =>
      !!form.reportDate &&
      !!form.projectId &&
      !!form.title.trim() &&
      !!form.description.trim() &&
      !isCreateBlocked &&
      !submitting,
    [form.description, form.projectId, form.reportDate, form.title, isCreateBlocked, submitting],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (isCreateBlocked) {
      setNote("Admin cannot add reporting. You can edit existing reporting only.");
      return;
    }

    const newErrors: Partial<Record<keyof ReportFormState, string>> = {};
    if (!form.reportDate) newErrors.reportDate = "Date is required.";
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!form.title.trim()) newErrors.title = "Title is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setNote("Please fix the highlighted fields.");
      return;
    }

    const payload = new FormData();
    payload.append("reportDate", form.reportDate);
    payload.append("projectId", form.projectId);
    payload.append("title", form.title.trim());
    payload.append("description", form.description.trim());
    payload.append("status", form.status);

    for (const file of imageFiles) {
      payload.append("images", file);
    }

    if (videoFile) {
      payload.append("video", videoFile);
    }

    if (reportId) {
      payload.append("existingImages", JSON.stringify(existingImages));
      if (existingVideoUrl) {
        payload.append("existingVideoUrl", existingVideoUrl);
      }
      payload.append("removeVideo", removeVideo ? "true" : "false");
    }

    setSubmitting(true);
    try {
      const endpoint = reportId ? `/api/reports/${reportId}` : "/api/reports";
      const res = await fetch(endpoint, {
        method: reportId ? "PUT" : "POST",
        body: payload,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setNote(data.error || "Failed to save report.");
        return;
      }

      toast.success(`Reporting ${reportId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/reports");
    } catch (error) {
      console.error("Failed to save report", error);
      setNote("Failed to save report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rbac-title-lg">{reportId ? "Edit Report" : "Add New Report"}</h3>
          </div>
          <form className="rbac-form" onSubmit={handleSubmit}>
            <div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="rbac-label">
                  Date <span className="text-red-600">*</span>
                  <input
                    type="date"
                    className="rbac-input"
                    value={form.reportDate}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, reportDate: event.target.value }))
                    }
                  />
                </label>
                {errors.reportDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.reportDate}</p>
                )}

                <label className="rbac-label">
                  Project <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select"
                    value={form.projectId}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, projectId: event.target.value }))
                    }
                  >
                    {projects.length === 0 && <option value="">No project available</option>}
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="rbac-label mt-5">
                Title <span className="text-red-600">*</span>
                <input
                  className="rbac-input"
                  placeholder="Work summary title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </label>
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}

              <label className="rbac-label mt-5">
                Description <span className="text-red-600">*</span>
                <textarea
                  className="rbac-input"
                  rows={4}
                  placeholder="Detailed description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}

              <div className="grid gap-5 mt-5 md:grid-cols-2">
                <label className="rbac-label">
                  Status
                  <select
                    className="rbac-input rbac-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as ReportStatus,
                      }))
                    }
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="ON_HOLD">On hold</option>
                    <option value="DONE">Done</option>
                  </select>
                </label>

                <label className="rbac-label">
                  Upload images
                  <input
                    className="rbac-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setImageFiles(Array.from(event.target.files || []))
                    }
                  />
                </label>
              </div>

              {existingImages.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">Existing images</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingImages.map((url) => (
                      <div
                        key={url}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1"
                      >
                        <a
                          className="rbac-link"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {url.split("/").pop()}
                        </a>
                        <button
                          className="rbac-link danger"
                          type="button"
                          onClick={() =>
                            setExistingImages((prev) => prev.filter((item) => item !== url))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="rbac-label mt-5">
                Upload video
                <input
                  className="rbac-input"
                  type="file"
                  accept="video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setVideoFile(file);
                    if (file) setRemoveVideo(false);
                  }}
                />
              </label>

              {existingVideoUrl && !videoFile && (
                <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm text-slate-700">
                    Existing video:{" "}
                    <a
                      className="rbac-link"
                      href={existingVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {existingVideoUrl.split("/").pop()}
                    </a>
                  </p>
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={removeVideo}
                      onChange={(event) => setRemoveVideo(event.target.checked)}
                    />
                    Remove existing video
                  </label>
                </div>
              )}

              {imageFiles.length > 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  {imageFiles.length} image file(s) selected.
                </p>
              )}

              {videoFile && (
                <p className="mt-2 text-sm text-slate-600">Selected video: {videoFile.name}</p>
              )}
            </div>

            {note && <p className="rbac-note">{note}</p>}

            <div className="rbac-actions">
              <button className="rbac-button" type="submit" disabled={!canSubmit}>
                Save
              </button>
              <Link href="/dashboard/reports">
              <button
                className="text-red-500"
                type="button"
              >
                Cancel
              </button>
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
