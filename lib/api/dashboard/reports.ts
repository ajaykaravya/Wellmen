import { createCrudApi } from "./resource";

export type ReportOption = {
  id: string;
  reportDate: string;
  projectId: string;
  projectName: string;
  projectCity?: string | null;
  categoryId: string | null;
  categoryName: string;
  description: string;
  imageUrls: string[];
  videoUrl: string | null;
  videoUrls?: string[];
  createdById: string | null;
  createdByName: string;
  canManage: boolean;
};

export const reportApi = createCrudApi<ReportOption, ReportOption, FormData, FormData>(
  "/api/reports",
);
