"use client";

// Client-side image optimizer: downscales huge phone photos and re-encodes to
// WebP before upload. A 6 MB 4032px iPhone shot becomes ~250 KB at 1600px with
// no visible quality loss on a listing page — and uploads in a second on 3G.

export type CompressOptions = {
  /** longest edge in px (default 1600 — plenty for full-width listing images) */
  maxEdge?: number;
  /** 0..1 (default 0.82 — visually lossless for photos) */
  quality?: number;
  /** output type; WebP is ~30% smaller than JPEG at equal quality */
  mime?: "image/webp" | "image/jpeg";
};

export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.82, mime = "image/webp" }: CompressOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  );
  if (!blob || blob.size >= file.size) return file; // never make it bigger

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "_");
  return new File([blob], `${base}.${ext}`, { type: mime });
}

/** Small square version for cards/thumbnails. */
export function compressThumb(file: File) {
  return compressImage(file, { maxEdge: 640, quality: 0.8 });
}

/** ID documents: keep more detail so text stays readable. */
export function compressDocument(file: File) {
  return compressImage(file, { maxEdge: 2000, quality: 0.88, mime: "image/jpeg" });
}
