import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";

const sanitizeName = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getExt = (file) => {
  const fromName = path.extname(file?.name || "");
  if (fromName) return fromName.toLowerCase();

  const type = String(file?.type || "").toLowerCase();
  if (type.includes("jpeg")) return ".jpg";
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("quicktime")) return ".mov";
  if (type.includes("webm")) return ".webm";
  return "";
};

// AutoCAD files have no reliable MIME type - browsers send
// application/octet-stream or an empty string - so drawings are validated by
// extension rather than by file.type.
const DRAWING_EXTENSIONS = {
  ".pdf": "PDF",
  ".ppt": "PPT",
  ".pptx": "PPT",
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".png": "IMAGE",
  ".dwg": "AUTOCAD",
  ".dxf": "AUTOCAD",
};

export const getDrawingFileType = (fileName) =>
  DRAWING_EXTENSIONS[path.extname(String(fileName || "")).toLowerCase()] || null;

export const ALLOWED_DRAWING_EXTENSIONS = Object.keys(DRAWING_EXTENSIONS);

// Documents attached to a project form (e.g. validation and calibration
// certificates). Validated by extension for the same reason as drawings.
const DOCUMENT_EXTENSIONS = {
  ".pdf": "PDF",
  ".doc": "DOC",
  ".docx": "DOC",
};

export const getDocumentFileType = (fileName) =>
  DOCUMENT_EXTENSIONS[path.extname(String(fileName || "")).toLowerCase()] || null;

export const ALLOWED_DOCUMENT_EXTENSIONS = Object.keys(DOCUMENT_EXTENSIONS);

const ensureUploadDir = async (scope) => {
  const uploadDir = path.join(process.cwd(), "public", "uploads", scope);
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
};

const getPublicUrl = (scope, name) => `/uploads/${scope}/${name}`;

const getSupabasePublicUrl = (projectId, kind, name) => {
  // Use the correct Supabase Storage URL format
  // Path: {projectId}/{kind}/{name}
  const baseUrl = String(process.env.SUPABASE_PROJECT_URL || "").replace(
    /\/rest\/v1\/?$/,
    "",
  );
  return `${baseUrl}/storage/v1/object/public/wellmen/${projectId}/${kind}/${name}`;
};

async function saveOne(file, { type, projectId, kind }) {
  if (!(file instanceof File) || !file.size) return null;

  if (!type || !projectId || !kind) {
    throw new Error("type, projectId, and kind are required for file upload.");
  }

  const fileType = String(file.type || "").toLowerCase();
  if (kind === "image" && !fileType.startsWith("image/")) {
    throw new Error("Only image files are allowed for images.");
  }
  if (kind === "video" && !fileType.startsWith("video/")) {
    throw new Error("Only video files are allowed for videos.");
  }
  if (kind === "drawing" && !getDrawingFileType(file.name)) {
    throw new Error(
      `Unsupported drawing file. Allowed types: ${ALLOWED_DRAWING_EXTENSIONS.join(", ")}.`,
    );
  }
  if (kind === "document" && !getDocumentFileType(file.name)) {
    throw new Error(
      `Unsupported document file. Allowed types: ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}.`,
    );
  }

  const ext = getExt(file);
  const baseName = sanitizeName(path.basename(file.name || "file", ext));
  const fileName = `${type}-${Date.now()}-${randomUUID()}-${baseName || kind}${ext}`;

  const saveLocally = async (bytes) => {
    const scope = `${projectId}/${kind}`;
    const uploadDir = await ensureUploadDir(scope);
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));
    return getPublicUrl(scope, fileName);
  };

  try {
    const bytes = await file.arrayBuffer();

    // Supabase is optional - without credentials, go straight to local disk.
    if (!supabase) {
      return saveLocally(bytes);
    }

    const uploadPath = `${projectId}/${kind}/${fileName}`;
    const { error } = await supabase.storage
      .from("wellmen")
      .upload(uploadPath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.warn(
        "Supabase upload failed, falling back to local storage:",
        error.message,
      );
      return saveLocally(bytes);
    }

    return getSupabasePublicUrl(projectId, kind, fileName);
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to upload file");
  }
}

export async function saveMediaFiles(files, options) {
  const list = Array.isArray(files) ? files : [];
  const urls = await Promise.all(list.map((file) => saveOne(file, options)));
  return urls.filter(Boolean);
}

export async function saveMediaFile(file, options) {
  return saveOne(file, options);
}
