"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import Loading from "../../../components/Loading";
import { getTodayInputDate, formatToDDMMYYYY } from "@/lib/dateUtils";
import { useDashboardContext } from "../../_components/DashboardShell";
import CustomDatePicker from "../../../components/CustomDatePicker";
import { ButtonGroup } from "../../_components/ButtonGroup";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role?: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
  city?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
};

type CategoryOption = {
  id: string;
  name: string;
  category: string;
};

type TodoFormState = {
  description: string;
  remarks: string;
  startDate: string;
  endDate?: string;
  status: "TODO" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  projectId: string;
  categoryId: string;
  assigneeId: string;
  taskType: TaskType | "";
  subCategory: ServiceSubCategory | "";
};

type TodoFormContentProps = {
  todoId?: string;
};

type TaskType = "project" | "office" | "service";
type PriorityLevel = "low" | "medium" | "high";
type ServiceSubCategory = "amc" | "warranty" | "without-warranty";

type FormErrorKey = keyof TodoFormState | "taskType" | "subCategory";

const categoryApiMap = {
  project: "/api/categories",
  office: "/api/office-categories",
  service: "/api/service-categories",
} as const;

const taskTypeOptions: Array<{ key: TaskType; label: string }> = [
  { key: "project", label: "Project" },
  { key: "office", label: "Office" },
  { key: "service", label: "Service" },
];

const priorityOptions: Array<{ key: PriorityLevel; label: string }> = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

const serviceSubCategoryOptions: Array<{
  key: ServiceSubCategory;
  label: string;
}> = [
  { key: "amc", label: "AMC" },
  { key: "warranty", label: "Warranty" },
  { key: "without-warranty", label: "Without Warranty" },
];

const resolveTaskTypeFromQuery = (value: string | null) => {
  if (value === "PROJECT" || value === "OFFICE" || value === "SERVICE") {
    return value.toLowerCase() as TaskType;
  }
  return null;
};

const parseDateInput = (value: string) => {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateForInput = (value?: string) => {
  if (!value) return "";
  const formatted = formatToDDMMYYYY(value);
  return formatted === "-" ? "" : formatted;
};

const getUserDisplayName = (user: UserOption) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ");

const getProjectDisplayName = (project: ProjectOption | null) => {
  if (!project) return "";

  const name = project.name.trim();
  const city = project.city?.trim();
  return city ? `${name} - ${city}` : name;
};

export default function TodoFormContent({ todoId }: TodoFormContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useDashboardContext();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [projectQuery, setProjectQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [form, setForm] = useState<TodoFormState>({
    description: "",
    remarks: "",
    startDate: getTodayInputDate(),
    endDate: "",
    status: "TODO",
    projectId: "",
    categoryId: "",
    assigneeId: "",
    taskType: "",
    subCategory: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";

        const [usersRes, projectsRes, todoRes] = await Promise.all([
          isAdmin ? fetch("/api/users/options") : Promise.resolve(null),
          fetch("/api/projects/options"),
          todoId ? fetch(`${endpoint}/${todoId}`) : Promise.resolve(null),
        ]);

        if (usersRes?.ok) {
          const data = await usersRes.json();
          setUsers(Array.isArray(data) ? data : []);
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }

        if (todoRes?.ok) {
          const todo = await todoRes.json();
          setForm({
            description: todo.description || "",
            remarks: todo.comments || "",
            startDate: formatDateForInput(todo.startDate),
            endDate: formatDateForInput(todo.endDate),
            status: todo.status || "TODO",
            projectId: todo.projectId || "",
            categoryId: todo.categoryId || "",
            assigneeId: todo.assigneeId || "",
            taskType: todo.type ? todo.type.toLowerCase() : "",
            subCategory: todo.subCategory || "",
          });

          if (todo.priority) {
            setPriority(todo.priority.toLowerCase());
          }
        }
      } catch (error) {
        console.error("Failed to load task data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, todoId]);

  useEffect(() => {
    if (todoId || form.taskType) return;
    const initialType = resolveTaskTypeFromQuery(searchParams.get("type"));
    if (initialType) {
      setForm((prev) => ({
        ...prev,
        taskType: initialType,
      }));
    }
  }, [searchParams, form.taskType, todoId]);

  const selectedTaskType = form.taskType || null;

  useEffect(() => {
    if (!selectedTaskType) return;
    const fetchCategories = async () => {
      try {
        const res = await fetch(categoryApiMap[selectedTaskType]);
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();

        setCategories(Array.isArray(data?.data) ? data.data : []);
        setForm((prev) => {
          const currentCategoryId = prev.categoryId || "";
          const stillValid = Array.isArray(data?.data)
            ? data.data.some(
                (category: CategoryOption) => category.id === currentCategoryId,
              )
            : false;

          return {
            ...prev,
            categoryId: stillValid ? currentCategoryId : "",
          };
        });
      } catch (err) {
        console.error(err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, [selectedTaskType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    const newErrors: Partial<Record<FormErrorKey, string>> = {};
    if (!form.taskType) {
      newErrors.taskType = "Task type is required.";
    }

    if (form.taskType === "service" && !form.subCategory) {
      newErrors.subCategory = "Sub category is required.";
    }

    if (!form.startDate) newErrors.startDate = "Start date is required.";
    if (!form.projectId.trim()) newErrors.projectId = "Project is required.";
    if (!form.categoryId.trim()) newErrors.categoryId = "Category is required.";
    if (isAdmin && !form.assigneeId.trim()) {
      newErrors.assigneeId = "Assignee is required.";
    }
    if (form.endDate) {
      const startDate = parseDateInput(form.startDate);
      const endDate = parseDateInput(form.endDate);
      if (!startDate) {
        newErrors.startDate = "Start date is invalid.";
      } else if (!endDate) {
        newErrors.endDate = "End date is invalid.";
      } else if (endDate < startDate) {
        newErrors.endDate = "End date cannot be earlier than start date.";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const basePayload: Record<string, unknown> = {
      description: form.description.trim(),
      comments: form.remarks.trim(),
      startDate: form.startDate,
      endDate: form.endDate || null,
      status: form.status,
      projectId: form.projectId,
      categoryId: form.categoryId,
      type: form.taskType.toUpperCase(),
      priority: priority.toUpperCase(),
      ...(isAdmin ? { assigneeId: form.assigneeId } : {}),
    };

    if (form.taskType === "service") {
      basePayload.subCategory = form.subCategory;
    }

    if (form.taskType === "office") {
      basePayload.isOfficeTask = true;
    }

    if (form.taskType === "project") {
      basePayload.isProjectTask = true;
    }

    try {
      setSaving(true);
      const endpoint = isAdmin ? "/api/todos" : "/api/my-todos";
      const res = await fetch(todoId ? `${endpoint}/${todoId}` : endpoint, {
        method: todoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Failed to save task.");
        return;
      }

      toast.success(`Task ${todoId ? "updated" : "created"} successfully.`);
      router.push("/dashboard/task-management");
    } catch (error) {
      console.error("Failed to save task", error);
      setNote("Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) ?? null,
    [form.projectId, projects],
  );

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.id === form.categoryId) ?? null,
    [categories, form.categoryId],
  );

  const filteredProjects = useMemo(() => {
    const baseProjects =
      selectedTaskType === "project"
        ? projects.filter((p) => p.status === "IN_PROGRESS")
        : projects;

    const normalizedQuery = projectQuery.trim().toLowerCase();
    const queryMatchedProjects = normalizedQuery
      ? baseProjects.filter((project) =>
          project.name.toLowerCase().includes(normalizedQuery),
        )
      : baseProjects;

    if (
      selectedProject &&
      !queryMatchedProjects.some((project) => project.id === selectedProject.id)
    ) {
      return [selectedProject, ...queryMatchedProjects];
    }

    return queryMatchedProjects;
  }, [projectQuery, projects, selectedProject, selectedTaskType]);

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
              {todoId ? "Edit Task" : "Add New Task"}
            </h3>
          </div>
          <form className="rbac-form" onSubmit={handleSubmit}>
            <div>
              <ButtonGroup
                title="Select Task Work Type"
                selected={selectedTaskType}
                options={taskTypeOptions}
                onSelect={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    taskType: value,
                    categoryId: "",
                    subCategory: "",
                  }))
                }
                required
              />
              {errors.taskType && (
                <p className="text-sm text-red-600 mb-2">{errors.taskType}</p>
              )}
            </div>
            <fieldset
              disabled={saving}
              className={saving ? "opacity-70 pointer-events-none" : ""}
            >
              <div>
                <label className="rbac-label">
                  Project <span className="text-red-600">*</span>
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
                    <div className="relative mb-2">
                      <ComboboxInput
                        className="rbac-input w-full pr-10"
                        placeholder="Search projects"
                        displayValue={getProjectDisplayName}
                        onChange={(event) =>
                          setProjectQuery(event.target.value)
                        }
                      />
                      <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDownIcon
                          className="h-4 w-4 text-slate-500"
                          aria-hidden="true"
                        />
                      </ComboboxButton>
                      <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        {filteredProjects.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-500">
                            No projects found
                          </div>
                        ) : (
                          filteredProjects.map((project) => (
                            <ComboboxOption
                              key={project.id}
                              value={project}
                              className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-slate-100 data-[selected]:bg-slate-200"
                            >
                              <div className="flex flex-col items-start">
                                <span>{project.name}</span>
                                <span className="text-xs opacity-75">
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
                  <p className="text-sm text-red-600 mb-2">
                    {errors.projectId}
                  </p>
                )}

                <label className="rbac-label">
                  Category <span className="text-red-600">*</span>
                  <Listbox
                    value={selectedCategory}
                    onChange={(category: CategoryOption | null) =>
                      setForm((prev) => ({
                        ...prev,
                        categoryId: category?.id || "",
                      }))
                    }
                    disabled={!selectedTaskType}
                  >
                    <div className="relative mb-2">
                      <ListboxButton className="rbac-input flex w-full items-center justify-between gap-3 text-left">
                        <span
                          className={selectedCategory ? "" : "text-slate-500"}
                        >
                          {selectedCategory?.name || "No category"}
                        </span>
                        <ChevronDownIcon
                          className="h-4 w-4 text-slate-500"
                          aria-hidden="true"
                        />
                      </ListboxButton>
                      <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <ListboxOption
                          value={null}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-slate-100 data-[selected]:bg-slate-200"
                        >
                          No category
                        </ListboxOption>
                        {categories.map((category) => (
                          <ListboxOption
                            key={category.id}
                            value={category}
                            className="cursor-pointer rounded-lg px-3 py-2 text-sm data-[focus]:bg-slate-100 data-[selected]:bg-slate-200"
                          >
                            {category.name}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </label>
                {errors.categoryId && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.categoryId}
                  </p>
                )}

                {selectedTaskType === "service" && (
                  <div className="mt-4">
                    <ButtonGroup
                      title="Sub Category"
                      selected={form.subCategory || null}
                      options={serviceSubCategoryOptions}
                      onSelect={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          subCategory: value,
                        }))
                      }
                      required
                    />
                    {errors.subCategory && (
                      <p className="text-sm text-red-600 mb-2">
                        {errors.subCategory}
                      </p>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-medium">
                      Select User <span className="text-red-600">*</span>
                    </p>
                    {users.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {users.map((user) => {
                          const isSelected = form.assigneeId === user.id;

                          return (
                            <button
                              key={user.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  assigneeId: user.id,
                                }))
                              }
                              className={
                                isSelected
                                  ? "rbac-button flex flex-col items-start gap-1 text-left"
                                  : "rbac-button rbac-button-secondary flex flex-col items-start gap-1 text-left"
                              }
                            >
                              <span className="font-medium">
                                {getUserDisplayName(user)}
                              </span>
                              <span className="text-xs opacity-75">
                                {user.role || "User"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No users available to assign.
                      </p>
                    )}
                    {errors.assigneeId && (
                      <p className="text-sm text-red-600 mb-2">
                        {errors.assigneeId}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <ButtonGroup
                    title="Select Priority"
                    selected={priority}
                    options={priorityOptions}
                    onSelect={(value) => setPriority(value)}
                    required
                  />
                </div>

                <label className="rbac-label mt-4">
                  Description
                  <textarea
                    className="rbac-input"
                    rows={4}
                    placeholder="Task details"
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="rbac-label mt-3">
                  Remarks
                  <textarea
                    className="rbac-input"
                    rows={3}
                    placeholder="Enter remarks"
                    value={form.remarks}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        remarks: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="rbac-label mt-5">
                  Start Date <span className="text-red-600">*</span>
                  <CustomDatePicker
                    value={form.startDate}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        startDate: value,
                      }))
                    }
                    placeholder="DD/MM/YYYY"
                    className="rbac-input mb-2"
                  />
                </label>
                {errors.startDate && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.startDate}
                  </p>
                )}

                <label className="rbac-label mt-5">
                  End Date
                  <CustomDatePicker
                    value={form.endDate}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        endDate: value,
                      }))
                    }
                    placeholder="DD/MM/YYYY"
                    className="rbac-input mb-2"
                  />
                </label>
                {errors.endDate && (
                  <p className="text-sm text-red-600 mb-2">{errors.endDate}</p>
                )}

                <label className="rbac-label">
                  Status <span className="text-red-600">*</span>
                  <select
                    className="rbac-input rbac-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        status: event.target.value as TodoFormState["status"],
                      }))
                    }
                  >
                    <option value="TODO">To do</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="ON_HOLD">On hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>
              </div>
            </fieldset>

            {note && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {note}
              </p>
            )}

            <div className="rbac-actions">
              <button className="rbac-button" type="submit" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" size={16} />
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              <button
                className="text-red-500"
                type="button"
                onClick={() => router.push("/dashboard/task-management")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
