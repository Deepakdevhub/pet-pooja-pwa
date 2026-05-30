/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — Image Utility
 * ═══════════════════════════════════════════════════════════
 * Resize, compress, and store menu item images.
 *
 * LOCAL MODE:  Returns compressed base64 data URL (stored in IndexedDB).
 * PRODUCTION:  Swap uploadImage() to POST to Cloudflare R2/Images Worker
 *              and return the CDN URL instead. Rendering code stays the same.
 */

const MAX_SIZE = 400;       // px — longest edge
const QUALITY  = 0.72;      // WebP quality (0–1)
const THUMB_SIZE = 80;       // px — thumbnail for search/admin
const THUMB_QUALITY = 0.6;

/**
 * Pick an image file from the user.
 * @returns {Promise<File|null>}
 */
export function pickImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      resolve(input.files?.[0] || null);
    });
    input.click();
  });
}

/**
 * Compress and resize an image File.
 * Returns a data URL (base64) ready to store.
 *
 * @param {File} file
 * @param {object} opts
 * @param {number} opts.maxSize   — longest edge in px (default 400)
 * @param {number} opts.quality   — 0–1 (default 0.72)
 * @returns {Promise<string>}     — data URL
 */
export async function compressImage(file, opts = {}) {
  const maxSize = opts.maxSize || MAX_SIZE;
  const quality = opts.quality || QUALITY;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Calculate new dimensions (maintain aspect ratio)
  let newW = width;
  let newH = height;
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      newW = maxSize;
      newH = Math.round(height * (maxSize / width));
    } else {
      newH = maxSize;
      newW = Math.round(width * (maxSize / height));
    }
  }

  // Draw to offscreen canvas
  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  // Compress as WebP (fallback to JPEG if unsupported)
  let blob;
  try {
    blob = await canvas.convertToBlob({ type: 'image/webp', quality });
  } catch {
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  }

  return blobToDataURL(blob);
}

/**
 * Generate a small thumbnail from a data URL.
 * @param {string} dataUrl
 * @returns {Promise<string>} — smaller data URL
 */
export async function generateThumbnail(dataUrl) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  let newW = width;
  let newH = height;
  if (width > THUMB_SIZE || height > THUMB_SIZE) {
    if (width > height) {
      newW = THUMB_SIZE;
      newH = Math.round(height * (THUMB_SIZE / width));
    } else {
      newH = THUMB_SIZE;
      newW = Math.round(width * (THUMB_SIZE / height));
    }
  }

  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, newW, newH);
  bitmap.close();

  let thumbBlob;
  try {
    thumbBlob = await canvas.convertToBlob({ type: 'image/webp', quality: THUMB_QUALITY });
  } catch {
    thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: THUMB_QUALITY });
  }
  return blobToDataURL(thumbBlob);
}

/**
 * Upload an image for a menu item.
 *
 * LOCAL:       Compresses → returns data URL (stored in IndexedDB).
 * PRODUCTION:  Swap this to POST to your Cloudflare R2 Worker:
 *
 *   const form = new FormData();
 *   form.append('file', file);
 *   form.append('itemId', itemId);
 *   const res = await fetch('https://your-worker.workers.dev/upload', { method: 'POST', body: form });
 *   const { url } = await res.json();
 *   return url;   // e.g. "https://pub-xxx.r2.dev/menu/p1.webp"
 *
 * @param {File} file
 * @param {string} itemId — for naming in R2
 * @returns {Promise<string>} — image URL (data URL or CDN URL)
 */
export async function uploadImage(file, itemId) {
  // ── LOCAL MODE ──
  const dataUrl = await compressImage(file);
  return dataUrl;

  // ── CLOUDFLARE R2 MODE (uncomment when deploying) ──
  // const compressed = await compressToBlob(file);
  // const form = new FormData();
  // form.append('file', compressed, `${itemId}.webp`);
  // const res = await fetch(`${CONFIG_R2_WORKER_URL}/upload`, { method: 'POST', body: form });
  // if (!res.ok) throw new Error('Upload failed');
  // const { url } = await res.json();
  // return url;
}

/**
 * Delete an image (no-op locally, calls R2 Worker in production).
 * @param {string} imageUrl
 */
export async function deleteImage(imageUrl) {
  // LOCAL: nothing to do — data URL lives in IndexedDB with the menu item.
  // PRODUCTION: await fetch(`${CONFIG_R2_WORKER_URL}/delete?url=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' });
}

// ── Helpers ──

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

/**
 * Get file size of a data URL in KB (for UI display).
 */
export function dataUrlSizeKB(dataUrl) {
  if (!dataUrl) return 0;
  // base64 string length × 0.75 gives byte count
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 0.75) / 1024);
}
