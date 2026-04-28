import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

async function saveOne(file, { scope, kind }) {
  if (!(file instanceof File) || !file.size) return null;

  const type = String(file.type || "").toLowerCase();
  if (kind === "image" && !type.startsWith("image/")) {
    throw new Error("Only image files are allowed for images.");
  }
  if (kind === "video" && !type.startsWith("video/")) {
    throw new Error("Only video files are allowed for videos.");
  }

  const uploadDir = await ensureUploadDir(scope);
  const ext = getExt(file);
  const baseName = sanitizeName(path.basename(file.name || "file", ext));
  const fileName = `${Date.now()}-${randomUUID()}-${baseName || kind}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  const bytes = await file.arrayBuffer();

  await writeFile(filePath, Buffer.from(bytes));
  return getPublicUrl(scope, fileName);
}

export async function saveMediaFiles(files, options) {
  const list = Array.isArray(files) ? files : [];
  const urls = await Promise.all(list.map((file) => saveOne(file, options)));
  return urls.filter(Boolean);
}

export async function saveMediaFile(file, options) {
  return saveOne(file, options);
}
