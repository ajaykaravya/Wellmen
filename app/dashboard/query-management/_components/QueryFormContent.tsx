"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import Link from "next/link";
import ConfirmDialog from "../../../components/ConfirmDialog";
import Loading from "../../../components/Loading";
import { ButtonGroup } from "../../_components/ButtonGroup";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { createQueryManagementApi } from "@/lib/api/dashboard/query-management";
import { loadProjectOptions, type ProjectOption } from "@/lib/api/dashboard/shared-options";

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
  const api = useMemo(() => createQueryManagementApi(apiBase), [apiBase]);
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [projectQuery, setProjectQuery] = useState("");
  const [confirmRemoveImageOpen, setConfirmRemoveImageOpen] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
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
        const [projects, query] = await Promise.all([
          loadProjectOptions(),
          queryId ? api.get(queryId) : Promise.resolve(null),
        ]);

        setProjects(projects);

        if (query) {
          const data = query as QueryPayload;
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
        }
      } catch (error) {
        console.error("Failed to load query data", error);
        setNote(error instanceof Error ? error.message : "Failed to load query.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [api, queryId]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  useEffect(() => {
    const urls = videoFiles.map((file) => URL.createObjectURL(file));
    setVideoPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [videoFiles]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || null,
    [form.projectId, projects],
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLowerCase();
    const filtered = normalizedQuery
      ? projects.filter((project) => {
        const name = project.name.toLowerCase();
        const city = (project.city || "").toLowerCase();
        return name.includes(normalizedQuery) || city.includes(normalizedQuery);
      })
      : projects;

    if (
      selectedProject &&
      !filtered.some((project) => project.id === selectedProject.id)
    ) {
      return [selectedProject, ...filtered];
    }

    return filtered;
  }, [projectQuery, projects, selectedProject]);

  const formatProjectLabel = (project: ProjectOption | null) => {
    if (!project) return "";
    const name = project.name.trim();
    const city = project.city?.trim();
    return city ? `${name} - ${city}` : name;
  };

  const setFieldValue = <K extends keyof QueryFormState>(
    field: K,
    value: QueryFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const promptRemoveExistingImage = (url: string) => {
    setImageToRemove(url);
    setConfirmRemoveImageOpen(true);
  };

  const confirmRemoveExistingImage = () => {
    if (!imageToRemove) return;

    setExistingImages((prev) => prev.filter((item) => item !== imageToRemove));
    setImageToRemove(null);
    setConfirmRemoveImageOpen(false);
  };

  const removeImagePreview = (index: number) => {
    setImageFiles((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeVideoPreview = (index: number) => {
    setVideoFiles((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
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
              const normalizedData =
                typeof data === "string"
                  ? new TextEncoder().encode(data).buffer
                  : (() => {
                    const bytes = new Uint8Array(data.byteLength);
                    bytes.set(
                      new Uint8Array(
                        data.buffer,
                        data.byteOffset,
                        data.byteLength,
                      ),
                    );
                    return bytes.buffer;
                  })();
              return new File([normalizedData], file.name, {
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

      if (queryId) {
        await api.update(queryId, payload);
      } else {
        await api.create(payload);
      }

      toast.success(`Query ${queryId ? "updated" : "created"} successfully.`);
      router.push(returnPath);
    } catch (error) {
      console.error("Failed to save query", error);
      const message =
        error instanceof Error ? error.message : "Failed to save query.";
      setNote(message);
      toast.error(message);
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
              <Combobox
                value={selectedProject}
                onChange={(project: ProjectOption | null) => {
                  setForm((prev) => ({
                    ...prev,
                    projectId: project?.id || "",
                  }));
                  setProjectQuery("");
                }}
                nullable
              >
                <div className="relative mb-1">
                  <ComboboxInput
                    className="theme-input rbac-input w-full pr-10"
                    placeholder="Search projects"
                    displayValue={formatProjectLabel}
                    onChange={(event) => setProjectQuery(event.target.value)}
                  />
                  <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--theme-text-muted)]">
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </ComboboxButton>
                  <ComboboxOptions
                    modal={false}
                    className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-lg text-[color:var(--theme-text)]"
                  >
                    {filteredProjects.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-[color:var(--theme-text-muted)]">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <ComboboxOption
                          key={project.id}
                          value={project}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-[var(--theme-surface-2)] data-[selected]:bg-[var(--theme-surface-2)]"
                        >
                          <div className="flex flex-col items-start">
                            <span>{project.name}</span>
                            <span className="text-xs text-[color:var(--theme-text-muted)]">
                              {project.city || "No city"}
                            </span>
                          </div>
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </div>
              </Combobox>
            </label>
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

              <div>
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
              </div>

              <div className="grid gap-2 md:gap-4 md:grid-cols-2">
                <label className="rbac-label">
                  Upload images
                  <input
                    ref={imageInputRef}
                    className="rbac-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      setImageFiles(Array.from(event.target.files || []));
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can upload multiple images. Max size per video is 10MB.
                  </p>
                </label>

                <label className="rbac-label">
                  Upload videos
                  <input
                    ref={videoInputRef}
                    className="rbac-input"
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(event) => {
                      setVideoFiles(Array.from(event.target.files || []));
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can upload multiple videos. Max size per video is 10MB.
                  </p>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Selected images
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {imagePreviews.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 aspect-square"
                      >
                        <img
                          src={url}
                          alt={`Selected image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove selected image ${index + 1}`}
                          onClick={() => removeImagePreview(index)}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md transition hover:bg-black"
                        >
                          <FaTimes size={12} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                          <p className="truncate text-xs text-white">
                            {imageFiles[index]?.name || `Image ${index + 1}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videoPreviews.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Selected videos
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {videoPreviews.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 aspect-square"
                      >
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          controls={false}
                        />
                        <button
                          type="button"
                          aria-label={`Remove selected video ${index + 1}`}
                          onClick={() => removeVideoPreview(index)}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md transition hover:bg-black"
                        >
                          <FaTimes size={12} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                          <p className="truncate text-xs text-white">
                            {videoFiles[index]?.name || `Video ${index + 1}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">
                    Existing images
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {existingImages.map((url) => (
                      <div
                        key={url}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 aspect-square"
                      >
                        <img
                          src={url}
                          alt="Existing query image"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => promptRemoveExistingImage(url)}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md transition hover:bg-black"
                        >
                          <FaTimes size={12} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                          <p className="truncate text-xs text-white">
                            {url.split("/").pop()}
                          </p>
                        </div>
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
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {existingVideoUrls.map((url) => (
                      <div
                        key={url}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 aspect-square"
                      >
                        <video
                          src={url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          controls={false}
                        />
                        <button
                          type="button"
                          aria-label="Remove video"
                          onClick={() =>
                            setExistingVideoUrls((prev) =>
                              prev.filter((item) => item !== url),
                            )
                          }
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white shadow-md transition hover:bg-black"
                        >
                          <FaTimes size={12} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                          <p className="truncate text-xs text-white">
                            {url.split("/").pop()}
                          </p>
                        </div>
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

          <ConfirmDialog
            open={confirmRemoveImageOpen}
            title="Remove image?"
            description="This will remove the image from the form. You can cancel to keep it."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={confirmRemoveExistingImage}
            onClose={() => {
              setConfirmRemoveImageOpen(false);
              setImageToRemove(null);
            }}
          />

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
