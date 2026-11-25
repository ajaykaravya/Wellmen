import { prisma } from "@/lib/prisma";

// Serves files saved in the StoredFile table by saveMediaFile(s).
// Public like the /uploads and Supabase public URLs it replaces - <img> and
// <video> tags can't send auth headers - and protected by the random UUID.

const INLINE_TYPES = /^(image\/|video\/|audio\/|application\/pdf$|text\/plain$)/;

const contentDisposition = (mimeType, fileName) => {
  const disposition = INLINE_TYPES.test(mimeType) ? "inline" : "attachment";
  const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};

export async function GET(req, { params }) {
  const { id } = await params;

  const file = /^[0-9a-f-]{36}$/i.test(id)
    ? await prisma.storedFile.findUnique({ where: { id } })
    : null;
  if (!file) {
    return new Response("File not found.", { status: 404 });
  }

  const data = Buffer.from(file.data);
  const headers = {
    "Content-Type": file.mimeType,
    "Content-Disposition": contentDisposition(file.mimeType, file.fileName),
    // A stored file never changes - a new upload gets a new id.
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  };

  // Byte ranges let browsers (Safari especially) seek and play videos.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  if (range && (range[1] || range[2])) {
    const size = data.length;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    return new Response(data.subarray(start, end + 1), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new Response(data, {
    headers: { ...headers, "Content-Length": String(data.length) },
  });
}
