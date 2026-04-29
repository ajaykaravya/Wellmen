"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import Link from "next/link";
import Loading from "../../../components/Loading";
import { ButtonGroup } from "../../_components/ButtonGroup";

type ProjectOption = {
  id: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
};

type QueryCategory = "REMARKS" | "URGENCY" | "DECISION_PENDING" | "";
type QueryStatus = "PENDING" | "COMPLETED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type QueryFormState = {
  projectId: string;
  category: QueryCategory;
  description: string;
  status: QueryStatus;
  priority: PriorityLevel;
};

type QueryPayload = QueryFormState & {
  imageUrls?: string[];
  videoUrls?: string[];
};

type QueryFormContentProps = {
  queryId?: string;
  apiBase?: string;
  returnPath?: string;
  title?: string;
  submitLabel?: string;
};

const categoryOptions: Array<{
  key: Exclude<QueryCategory, "">;
  label: string;
}> = [
  { key: "REMARKS", label: "Remarks" },
  { key: "URGENCY", label: "Urgency" },
  { key: "DECISION_PENDING", label: "Decision Pending" },
];

const statusOptions: Array<{ key: QueryStatus; label: string }> = [
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
];

const priorityOptions: Array<{ key: PriorityLevel; label: string }> = [
  { key: "LOW", label: "Low" },
  { key: "MEDIUM", label: "Medium" },
  { key: "HIGH", label: "High" },
];

export default function QueryFormContent({
  queryId,
  apiBase = "/api/query-management",
  returnPath = "/dashboard/query-management",
  title,
  submitLabel,
}: QueryFormContentProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof QueryFormState, string>>
  >({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [form, setForm] = useState<QueryFormState>({
    projectId: "",
    category: "",
    description: "",
    status: "PENDING",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, queryRes] = await Promise.all([
          fetch("/api/projects/options"),
          queryId ? fetch(`${apiBase}/${queryId}`) : Promise.resolve(null),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (queryRes?.ok) {
          const data = (await queryRes.json()) as QueryPayload;
          setForm({
            projectId: data.projectId || "",
            category: data.category || "",
            description: data.description || "",
            status: data.status || "PENDING",
            priority: data.priority || "MEDIUM",
          });
          setExistingImages(
            Array.isArray(data.imageUrls) ? data.imageUrls : [],
          );
          setExistingVideoUrls(
            Array.isArray(data.videoUrls) ? data.videoUrls : [],
          );
        } else if (queryRes && !queryRes.ok) {
          setNote("Failed to load query.");
        }
      } catch (error) {
        console.error("Failed to load query data", error);
        setNote("Failed to load query.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBase, queryId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const formatQueryLabel = (value: string) => value.replaceAll("_", " ");
  const setFieldValue = <K extends keyof QueryFormState>(
    field: K,
    value: QueryFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<keyof QueryFormState, string>> = {};
    if (!form.projectId.trim()) newErrors.projectId = "Project is required.";
    if (!form.category) newErrors.category = "Category is required.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";
    if (!form.status) newErrors.status = "Status is required.";
    if (!form.priority) newErrors.priority = "Priority is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const MAX_VIDEO_SIZE = 10 * 1024 * 1024;
    const COMPRESS_THRESHOLD = 10 * 1024 * 1024;

    for (const file of videoFiles) {
      if (file.size > MAX_VIDEO_SIZE) {
        const errorMsg = `Video ${file.name} is too large. Maximum size is 10MB.`;
        setNote(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    try {
      let finalVideoFiles = [...videoFiles];
      const needsCompression = videoFiles.some(
        (f) => f.size > COMPRESS_THRESHOLD,
      );

      if (needsCompression) {
        setCompressing(true);
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        finalVideoFiles = await Promise.all(
          videoFiles.map(async (file) => {
            if (file.size > COMPRESS_THRESHOLD) {
              await ffmpeg.writeFile(file.name, await fetchFile(file));
              await ffmpeg.exec([
                "-i",
                file.name,
                "-vcodec",
                "libx264",
                "-preset",
                "superfast",
                "-crf",
                "28",
                `compressed_${file.name}`,
              ]);
              const data = await ffmpeg.readFile(`compressed_${file.name}`);
              return new File([data as any], file.name, {
                type: file.type,
              });
            }
            return file;
          }),
        );
        setCompressing(false);
      }

      setSaving(true);
      const payload = new FormData();
      payload.append("projectId", form.projectId.trim());
      payload.append("category", form.category);
      payload.append("description", form.description.trim());
      payload.append("status", form.status);
      payload.append("priority", form.priority);

      for (const file of imageFiles) {
        payload.append("images", file);
      }

      for (const file of finalVideoFiles) {
        payload.append("videos", file);
      }

      if (queryId) {
        payload.append("existingImages", JSON.stringify(existingImages));
        payload.append("existingVideoUrls", JSON.stringify(existingVideoUrls));
      }

      const res = await fetch(queryId ? `${apiBase}/${queryId}` : apiBase, {
        method: queryId ? "PUT" : "POST",
        body: payload,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save query.";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(`Query ${queryId ? "updated" : "created"} successfully.`);
      router.push(returnPath);
    } catch (error) {
      console.error("Failed to save query", error);
      setNote("Failed to save query.");
    } finally {
      setSaving(false);
      setCompressing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <section className="rbac-section rbac-container">
      <div className="rbac-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="rbac-title-lg">
            {title || (queryId ? "Edit Query" : "Add New Query")}
          </h3>
        </div>

        <form className="rbac-form" onSubmit={handleSubmit}>
          <fieldset
            disabled={saving || compressing}
            className={
              saving || compressing ? "pointer-events-none opacity-70" : ""
            }
          >
            <label className="rbac-label">
              Select Project <span className="text-red-600">*</span>
              <select
                className="rbac-input rbac-select mb-2"
                value={form.projectId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    projectId: event.target.value,
                  }))
                }
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedProject && (
              <p className="mb-4 text-xs text-slate-500">
                Selected: {selectedProject.name}{" "}
                <span className="text-slate-400">
                  ({formatQueryLabel(selectedProject.status)})
                </span>
              </p>
            )}
            {errors.projectId && (
              <p className="text-sm text-red-600 mb-2">{errors.projectId}</p>
            )}

            <div className="mt-4 grid gap-4">
              <ButtonGroup
                title="Category"
                selected={form.category || null}
                options={categoryOptions}
                onSelect={(value) => setFieldValue("category", value)}
                error={errors.category}
                required
              />

              <label className="rbac-label">
                Description <span className="text-red-600">*</span>
                <textarea
                  className="rbac-input"
                  rows={4}
                  placeholder="Describe the query"
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
                <p className="text-sm text-red-600">{errors.description}</p>
              )}

              <div className="grid gap-5 md:grid-cols-2">
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
                <div className="rounded-xl border border-slate-200 p-3">
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
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">
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
                <p className="text-sm text-slate-600">
                  {imageFiles.length} image file(s) selected.
                </p>
              )}

              {videoFiles.length > 0 && (
                <p className="text-sm text-slate-600">
                  {videoFiles.length} video file(s) selected.
                </p>
              )}

              <ButtonGroup
                title="Status"
                selected={form.status}
                options={statusOptions}
                onSelect={(value) => setFieldValue("status", value)}
                error={errors.status}
                required
              />
              <ButtonGroup
                title="Priority"
                selected={form.priority}
                options={priorityOptions}
                onSelect={(value) => setFieldValue("priority", value)}
                error={errors.priority}
                required
              />
            </div>
          </fieldset>

          {note && <p className="text-sm text-red-600 mt-4">{note}</p>}

          <div className="rbac-actions mt-6">
            <button
              className="rbac-button"
              type="submit"
              disabled={saving || compressing}
            >
              {compressing ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" size={16} />
                  Video is compressing...
                </span>
              ) : saving ? (
                <span className="inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" size={16} />
                  Saving...
                </span>
              ) : (
                submitLabel || "Save"
              )}
            </button>
            <Link href={returnPath}>
              <button
                className="text-red-500"
                type="button"
                disabled={saving || compressing}
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
