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

const serializeQuery = (query, userId = "") => ({
  id: query.id,
  projectId: query.projectId,
  projectName: query.project?.name || "",
  category: query.category,
  description: query.description,
  status: query.status,
  priority: query.priority,
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
  serializeQuery,
};
