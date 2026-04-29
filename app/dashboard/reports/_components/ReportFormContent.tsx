"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDashboardContext } from "../../_components/DashboardShell";
import CustomDatePicker from "../../../components/CustomDatePicker";
import Loading from "../../../components/Loading";
import Link from "next/link";
import { getTodayInputDate, formatToDDMMYYYY } from "@/lib/dateUtils";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

type ReportPayload = {
  id: string;
  reportDate: string;
  projectId: string;
  categoryId: string | null;
  categoryName: string;
  description: string;
  imageUrls: string[];
  videoUrl: string | null;
  videoUrls?: string[];
};

type ReportFormState = {
  reportDate: string;
  projectId: string;
  categoryId: string;
  description: string;
};

type ReportFormContentProps = {
  reportId?: string;
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const formatted = formatToDDMMYYYY(value);
  return formatted === "-" ? "" : formatted;
};

export default function ReportFormContent({
  reportId,
}: ReportFormContentProps) {
  const router = useRouter();
  const { isAdmin } = useDashboardContext();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ReportFormState, string>>
  >({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const [form, setForm] = useState<ReportFormState>({
    reportDate: getTodayInputDate(),
    projectId: "",
    categoryId: "",
    description: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, categoriesRes, reportRes] = await Promise.all([
          fetch("/api/projects/options"),
          fetch("/api/reporting-categories?page=1&pageSize=100"),
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

        if (categoriesRes?.ok) {
          const data = await categoriesRes.json();
          const rows = Array.isArray(data?.data) ? data.data : [];
          setCategories(rows);
        }

        if (reportRes) {
          if (!reportRes.ok) {
            setNote("Failed to load reporting details.");
          } else {
            const report = (await reportRes.json()) as ReportPayload;
            setForm({
              reportDate: formatDateForInput(report.reportDate),
              projectId: report.projectId || "",
              categoryId: report.categoryId || "",
              description: report.description || "",
            });
            setExistingImages(
              Array.isArray(report.imageUrls) ? report.imageUrls : [],
            );
            setExistingVideoUrls(
              Array.isArray(report.videoUrls)
                ? report.videoUrls
                : report.videoUrl
                  ? [report.videoUrl]
                  : [],
            );
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (isCreateBlocked) {
      setNote(
        "Admin cannot add reporting. You can edit existing reporting only.",
      );
      return;
    }

    const newErrors: Partial<Record<keyof ReportFormState, string>> = {};
    if (!form.reportDate) newErrors.reportDate = "Date is required.";
    if (!form.projectId) newErrors.projectId = "Project is required.";
    if (!form.categoryId)
      newErrors.categoryId = "Reporting category is required.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const MAX_VIDEO_SIZE = 70 * 1024 * 1024;
    const COMPRESS_THRESHOLD = 60 * 1024 * 1024;

    for (const file of videoFiles) {
      if (file.size > MAX_VIDEO_SIZE) {
        const errorMsg = `Video ${file.name} is too large. Maximum size is 70MB.`;
        setNote(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    setSubmitting(true);
    let finalVideoFiles = [...videoFiles];
    try {
      const needsCompression = videoFiles.some((f) => f.size > COMPRESS_THRESHOLD);

      if (needsCompression) {
        setCompressing(true);
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        finalVideoFiles = await Promise.all(
          videoFiles.map(async (file) => {
            if (file.size > COMPRESS_THRESHOLD) {
              await ffmpeg.writeFile(file.name, await fetchFile(file));
              await ffmpeg.exec([
                "-i", file.name,
                "-vcodec", "libx264",
                "-preset", "superfast",
                "-crf", "28",
                `compressed_${file.name}`,
              ]);
              const data = await ffmpeg.readFile(`compressed_${file.name}`);
              return new File([data as any], file.name, {
                type: file.type,
              });
            }
            return file;
          })
        );
        setCompressing(false);
      }

      const payload = new FormData();
      payload.append("reportDate", form.reportDate);
      payload.append("projectId", form.projectId);
      payload.append("categoryId", form.categoryId);
      payload.append("description", form.description.trim());

      for (const file of imageFiles) {
        payload.append("images", file);
      }

      for (const file of finalVideoFiles) {
        payload.append("videos", file);
      }

    if (reportId) {
      payload.append("existingImages", JSON.stringify(existingImages));
      payload.append("existingVideoUrls", JSON.stringify(existingVideoUrls));
    }
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

      toast.success(
        `Reporting ${reportId ? "updated" : "created"} successfully.`,
      );
      router.push("/dashboard/reports");
    } catch (error) {
      console.error("Failed to save report", error);
      toast.error("Failed to save report.");
      setNote("Failed to save report.");
    } finally {
      setSubmitting(false);
      setCompressing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rbac-title-lg">
              {reportId ? "Edit Report" : "Add New Report"}
            </h3>
          </div>
          <form className="rbac-form" onSubmit={handleSubmit}>
            <fieldset
              disabled={submitting || compressing}
              className={submitting || compressing ? "opacity-70 pointer-events-none" : ""}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="rbac-label">
                  Date <span className="text-red-600">*</span>
                  <CustomDatePicker
                    value={form.reportDate}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, reportDate: value }))
                    }
                    placeholder="DD/MM/YYYY"
                    className="rbac-input"
                  />
                </label>
                {errors.reportDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.reportDate}
                  </p>
                )}

                <label className="rbac-label">
                  Project <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select"
                    value={form.projectId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        projectId: event.target.value,
                      }))
                    }
                  >
                    {projects.length === 0 && (
                      <option value="">No project available</option>
                    )}
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                {errors.projectId && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.projectId}
                  </p>
                )}

                <div>
                  <label className="rbac-label">
                    Reporting Category <span className="text-red-600">*</span>
                    <select
                      className="rbac-input rbac-select"
                      value={form.categoryId}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          categoryId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select reporting category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.categoryId}
                    </p>
                  )}
                </div>
              </div>

              <label className="rbac-label mt-5">
                Description <span className="text-red-600">*</span>
                <textarea
                  className="rbac-input"
                  rows={4}
                  placeholder="Detailed description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description}
                </p>
              )}

              <div className="grid gap-5 mt-5 md:grid-cols-2">
                <label className="rbac-label">
                  Upload images
                  <input
                    className="rbac-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      setImageFiles(Array.from(event.target.files || []));
                    }}
                  />
                </label>

                <label className="rbac-label">
                  Upload videos
                  <input
                    className="rbac-input"
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(event) => {
                      setVideoFiles(Array.from(event.target.files || []));
                    }}
                  />
                </label>
              </div>

              {existingImages.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Existing images
                  </p>
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
                            setExistingImages((prev) =>
                              prev.filter((item) => item !== url),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingVideoUrls.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm text-slate-700">
                    Existing videos
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingVideoUrls.map((url) => (
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
                            setExistingVideoUrls((prev) =>
                              prev.filter((item) => item !== url),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageFiles.length > 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  {imageFiles.length} image file(s) selected.
                </p>
              )}

              {videoFiles.length > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  {videoFiles.length} video file(s) selected.
                </p>
              )}

              {note && <p className="mt-2 text-sm text-red-600">{note}</p>}
            </fieldset>

            <div className="rbac-actions">
              <button
                className="rbac-button"
                type="submit"
                disabled={submitting || compressing}
              >
                {compressing ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" size={16} />
                    Video is compressing...
                  </span>
                ) : submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" size={16} />
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              <Link href="/dashboard/reports">
                <button
                  className="text-red-500"
                  type="button"
                  disabled={submitting || compressing}
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
