import { saveMediaFile, saveMediaFiles } from "../../_utils/mediaUpload";

export async function saveReportImages(files, projectId) {
  return saveMediaFiles(files, { type: "reports", projectId, kind: "image" });
}

export async function saveReportVideos(files, projectId) {
  return saveMediaFiles(files, { type: "reports", projectId, kind: "video" });
}

export async function saveReportVideo(file, projectId) {
  return saveMediaFile(file, { type: "reports", projectId, kind: "video" });
}
