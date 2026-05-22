import { prisma } from "@/lib/prisma";

export const taskTypeToCategory = {
  PROJECT: "PROJECT_WORK",
  OFFICE: "OFFICE_WORK",
  SERVICE: "SERVICE_WORK",
};

export const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TODO") return "TODO";
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "ON_HOLD") return "ON_HOLD";
  return null;
};

export const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    );
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const parseProjectId = (value) => String(value || "").trim();

export const isAdminRole = (auth) =>
  auth?.role === "Admin" || auth?.role === "Manager";

export const validateCategoryForType = async (type, categoryId) => {
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { ok: false, error: "Category not found." };
  }

  const expectedCategory = taskTypeToCategory[type];
  if (expectedCategory && category.category !== expectedCategory) {
    return {
      ok: false,
      error: "Category does not match the selected task type.",
    };
  }

  return { ok: true, category };
};

export const ensureEndDateIsValid = (startDate, endDate) => {
  if (endDate && endDate < startDate) {
    return "End date cannot be earlier than start date.";
  }
  return null;
};

export const resolveCompletedDate = (currentTodo, nextStatus) => {
  if (nextStatus !== "COMPLETED") {
    return nextStatus ? null : undefined;
  }

  if (
    currentTodo?.status === "COMPLETED" &&
    currentTodo?.completedDate
  ) {
    return currentTodo.completedDate;
  }

  return new Date();
};

const buildAssignee = (todo) =>
  todo.assignee
    ? {
        id: todo.assignee.id,
        firstName: todo.assignee.firstName,
        lastName: todo.assignee.lastName,
        mobileNumber: todo.assignee.mobileNumber,
        role: todo.assignee.role?.name || null,
      }
    : null;

export const serializeTodo = (todo, userId) => ({
  id: todo.id,
  description: todo.description,
  comments: todo.comments,
  startDate: todo.startDate,
  endDate: todo.endDate || null,
  completedDate: todo.completedDate || null,
  status: todo.status,
  projectId: todo.projectId,
  projectName: todo.project?.name || "-",
  projectCity: todo.project?.city || null,
  type: todo.type,
  priority: todo.priority,
  categoryId: todo.categoryId,
  categoryName: todo.category?.name || "-",
  categoryType: todo.category?.category || null,
  category: todo.category
    ? {
        id: todo.category.id,
        name: todo.category.name,
        category: todo.category.category,
      }
    : null,
  subCategory: todo.subCategory || null,
  assigneeId: todo.assigneeId,
  assignee: buildAssignee(todo),
  createdById: todo.createdById,
  canManage: Boolean(userId && todo.createdById === userId),
  createdAt: todo.createdAt,
});
