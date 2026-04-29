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

const ensureUploadDir = async (scope) => {
  const uploadDir = path.join(process.cwd(), "public", "uploads", scope);
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
};

const getPublicUrl = (scope, name) => `/uploads/${scope}/${name}`;

const getSupabasePublicUrl = (projectId, kind, name) => {
  // Use the correct Supabase Storage URL format
  // Path: {projectId}/{kind}/{name}
  const baseUrl = process.env.SUPABASE_PROJECT_URL.replace(
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

  const ext = getExt(file);
  const baseName = sanitizeName(path.basename(file.name || "file", ext));
  const fileName = `${type}-${Date.now()}-${randomUUID()}-${baseName || kind}${ext}`;

  try {
    // Try to upload to Supabase first
    const bytes = await file.arrayBuffer();
    const uploadPath = `${projectId}/${kind}/${fileName}`;
    const { data, error } = await supabase.storage
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
      // Fallback to local storage
      const scope = `${projectId}/${kind}`;
      const uploadDir = await ensureUploadDir(scope);
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, Buffer.from(bytes));
      return getPublicUrl(scope, fileName);
    }

    // Return Supabase public URL
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
