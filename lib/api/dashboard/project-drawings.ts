import { requestJson } from "../client";

export type DrawingCategoryOption = {
  id: string;
  name: string;
  sortOrder: number;
};

export type DrawingFileType = "PDF" | "PPT" | "IMAGE" | "AUTOCAD";

export type ProjectDrawing = {
  id: string;
  projectId: string;
  drawingCategoryId: string;
  categoryName: string | null;
  fileType: DrawingFileType;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

export async function loadDrawingCategories() {
  return requestJson<DrawingCategoryOption[]>({
    path: "/api/drawing-categories",
  });
}

export async function loadProjectDrawings(projectId: string) {
  const data = await requestJson<{ data: ProjectDrawing[] }>({
    path: `/api/projects/${projectId}/drawings`,
  });
  return data?.data || [];
}

export async function uploadProjectDrawings(
  projectId: string,
  drawingCategoryId: string,
  files: File[],
) {
  const form = new FormData();
  form.append("drawingCategoryId", drawingCategoryId);
  files.forEach((file) => form.append("files", file));

  return requestJson<{ data: ProjectDrawing[] }>({
    path: `/api/projects/${projectId}/drawings`,
    method: "POST",
    body: form,
  });
}

export async function deleteProjectDrawing(
  projectId: string,
  drawingId: string,
) {
  return requestJson<{ success: boolean }>({
    path: `/api/projects/${projectId}/drawings/${drawingId}`,
    method: "DELETE",
  });
}
