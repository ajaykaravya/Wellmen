const parseCategory = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "REMARKS") return "REMARKS";
  if (normalized === "URGENCY") return "URGENCY";
  if (normalized === "DECISION_PENDING") return "DECISION_PENDING";
  return null;
};

const parseStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "COMPLETED") return "COMPLETED";
  return null;
};

const parsePriority = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "LOW") return "LOW";
  if (normalized === "MEDIUM") return "MEDIUM";
  if (normalized === "HIGH") return "HIGH";
  return null;
};

const parsePayload = (body) => {
  const projectId = String(body.projectId || "").trim();
  const category = parseCategory(body.category);
  const description = String(body.description || "").trim();
  const status = parseStatus(body.status);
  const priority = parsePriority(body.priority);

  return { projectId, category, description, status, priority };
};

const parseJsonArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim());
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && item.trim())
      : [];
  } catch {
    return [];
  }
};

const normalizeMediaUrls = (value) => parseJsonArray(value);

const getFormText = (form, key) => String(form.get(key) || "").trim();

const parseMultipartPayload = (form) => {
  const projectId = getFormText(form, "projectId");
  const category = parseCategory(form.get("category"));
  const description = getFormText(form, "description");
  const status = parseStatus(form.get("status"));
  const priority = parsePriority(form.get("priority"));

  return { projectId, category, description, status, priority };
};

const getUploadedFiles = (form, key) =>
  form
    .getAll(key)
    .filter((value) => value instanceof File && value.size > 0);

const serializeQuery = (query, userId = "") => ({
  id: query.id,
  projectId: query.projectId,
  projectName: query.project?.name || "",
  projectCity: query.project?.city || null,
  category: query.category,
  description: query.description,
  status: query.status,
  priority: query.priority,
  imageUrls: normalizeMediaUrls(query.imageUrls),
  videoUrls: normalizeMediaUrls(query.videoUrls),
  videoUrl:
    Array.isArray(query.videoUrls) && query.videoUrls.length > 0
      ? query.videoUrls[0]
      : null,
  createdById: query.createdById,
  createdByName:
    query.createdBy?.firstName || query.createdBy?.lastName
      ? `${query.createdBy.firstName || ""} ${query.createdBy.lastName || ""}`.trim()
      : "",
  canManage: query.createdById === userId,
  createdAt: query.createdAt,
  updatedAt: query.updatedAt,
});

export {
  parseCategory,
  parseStatus,
  parsePriority,
  parsePayload,
  parseJsonArray,
  normalizeMediaUrls,
  parseMultipartPayload,
  getUploadedFiles,
  serializeQuery,
};
