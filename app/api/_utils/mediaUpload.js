import { unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

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
  ".doc": "DOC",
  ".docx": "DOC",
  ".xls": "EXCEL",
  ".xlsx": "EXCEL",
  ".csv": "EXCEL",
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".png": "IMAGE",
  ".dwg": "AUTOCAD",
  ".dxf": "AUTOCAD",
};

// Browsers send an empty file.type for files they don't recognise (DWG/DXF,
// sometimes CSV/DOC on some OSes). An empty string would override Supabase's
// default content type and make the storage upload fail, so fill it in from
// the extension.
const MIME_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".dwg": "application/octet-stream",
  ".dxf": "application/octet-stream",
};

const resolveContentType = (file, ext) =>
  String(file?.type || "").trim() ||
  MIME_BY_EXTENSION[ext] ||
  "application/octet-stream";

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

const STORED_FILE_URL_PREFIX = "/api/files/";

const getSupabasePublicUrl = (projectId, kind, name) => {
  // Use the correct Supabase Storage URL format
  // Path: {projectId}/{kind}/{name}
  const baseUrl = String(process.env.SUPABASE_PROJECT_URL || "").replace(
    /\/rest\/v1\/?$/,
    "",
  );
  return `${baseUrl}/storage/v1/object/public/wellmen/${projectId}/${kind}/${name}`;
};

// Vercel has no writable disk, so without Supabase the file bytes are kept in
// the StoredFile table and served by /api/files/[id].
const saveToDatabase = async (file, ext, bytes) => {
  const row = await prisma.storedFile.create({
    data: {
      fileName: String(file.name || `file${ext}`).slice(0, 191),
      mimeType: resolveContentType(file, ext),
      size: bytes.byteLength,
      data: new Uint8Array(bytes),
    },
    select: { id: true },
  });
  return `${STORED_FILE_URL_PREFIX}${row.id}`;
};

const storageError = (error) =>
  new Error(
    `Storage upload failed: ${error instanceof Error ? error.message : String(error)}`,
  );

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
  const bytes = await file.arrayBuffer();

  if (supabase) {
    const baseName = sanitizeName(path.basename(file.name || "file", ext));
    const fileName = `${type}-${Date.now()}-${randomUUID()}-${baseName || kind}${ext}`;
    const { error } = await supabase.storage
      .from("wellmen")
      .upload(`${projectId}/${kind}/${fileName}`, bytes, {
        contentType: resolveContentType(file, ext),
        upsert: false,
      });
    if (!error) return getSupabasePublicUrl(projectId, kind, fileName);
    console.warn(
      "Supabase upload failed, falling back to database storage:",
      error.message,
    );
  }

  try {
    return await saveToDatabase(file, ext, bytes);
  } catch (error) {
    console.error("Database file upload failed:", error);
    throw storageError(error);
  }
}

// Best-effort removal of a file saved by saveMediaFile(s). Never throws, so a
// missing or unreachable file can't block deleting the record that owns it.
export async function deleteMediaFile(fileUrl) {
  const url = String(fileUrl || "");
  try {
    if (url.startsWith(STORED_FILE_URL_PREFIX)) {
      const id = url.slice(STORED_FILE_URL_PREFIX.length).split(/[/?#]/)[0];
      await prisma.storedFile.deleteMany({ where: { id } });
    } else if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url.replace(/^\//, "")));
    } else if (supabase) {
      const marker = "/storage/v1/object/public/wellmen/";
      const index = url.indexOf(marker);
      if (index !== -1) {
        await supabase.storage
          .from("wellmen")
          .remove([url.slice(index + marker.length)]);
      }
    }
  } catch (error) {
    console.warn("Failed to remove stored file", url, error);
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
