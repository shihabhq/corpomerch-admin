"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Client-side image pipeline: validate -> square-pad -> WebP -> Storage.
 *
 * Converting in the browser keeps `sharp` off the request path and means a
 * 6 MB phone photo becomes a ~120 KB WebP before it ever crosses the network.
 * Uploads use the admin's own Supabase session — no service-role key.
 */

export const BUCKET = "product-images";
const MAX_BYTES = 10 * 1024 * 1024;
const TARGET = 1000;
const QUALITY = 0.82;

export interface UploadedImage {
  storagePath: string;
  width: number;
  height: number;
  blurDataUrl: string;
  wasSquare: boolean;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

function drawTo(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  // Product shots render as `object-contain` on a light pad, so letterbox
  // rather than crop — cropping merchandise is never the right default.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not encode the image.")),
      "image/webp",
      quality,
    );
  });
}

export async function processAndUpload(
  file: File,
  productSlug: string,
): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }

  const img = await loadImage(file);
  const wasSquare = Math.abs(img.width - img.height) <= 2;

  const webp = await toBlob(drawTo(img, TARGET), QUALITY);
  const blurBlob = await toBlob(drawTo(img, 16), 0.4);

  const blurDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not build the blur placeholder."));
    reader.readAsDataURL(blurBlob);
  });

  const base = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const storagePath = `products/${productSlug || "unsorted"}/${Date.now()}-${
    base || "image"
  }.webp`;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, webp, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return { storagePath, width: TARGET, height: TARGET, blurDataUrl, wasSquare };
}

export async function removeUpload(storagePath: string) {
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
