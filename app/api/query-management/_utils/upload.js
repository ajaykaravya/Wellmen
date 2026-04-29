import { saveMediaFile, saveMediaFiles } from "../../_utils/mediaUpload";

export async function saveQueryImages(files, projectId) {
  return saveMediaFiles(files, {
    type: "query-management",
    projectId,
    kind: "image",
  });
}

export async function saveQueryVideos(files, projectId) {
  return saveMediaFiles(files, {
    type: "query-management",
    projectId,
    kind: "video",
  });
}

export async function saveQueryVideo(file, projectId) {
  return saveMediaFile(file, {
    type: "query-management",
    projectId,
    kind: "video",
  });
}
