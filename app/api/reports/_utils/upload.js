import { saveMediaFile, saveMediaFiles } from "../../_utils/mediaUpload";

export async function saveReportImages(files) {
  return saveMediaFiles(files, { scope: "reporting", kind: "image" });
}

export async function saveReportVideos(files) {
  return saveMediaFiles(files, { scope: "reporting", kind: "video" });
}

export async function saveReportVideo(file) {
  return saveMediaFile(file, { scope: "reporting", kind: "video" });
}
