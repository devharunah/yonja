import type { FaceBox } from "@/lib/ai/schemas";

const MAX_DIMENSION = 1024;
/** Base64 runs ~4/3 of the bytes; this keeps each photo under ~500 KB and a Firestore doc under 1 MB. */
const MAX_DATA_URL_LENGTH = 650_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file could not be read as a photo."));
    img.src = src;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

function canvasFor(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process photos.");
  return { canvas, ctx };
}

/** Downscales and re-encodes a photo on the phone, so uploads stay small on slow data. */
export async function compressPhoto(file: File): Promise<string> {
  const img = await loadImage(await readFile(file));
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const { canvas, ctx } = canvasFor(width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.75;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

/** Pixelates every face box, padded a little, so no recognisable face is ever stored. */
export async function pixelateFaces(dataUrl: string, faces: FaceBox[]): Promise<string> {
  if (faces.length === 0) return dataUrl;
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const { canvas, ctx } = canvasFor(W, H);
  ctx.drawImage(img, 0, 0);

  for (const face of faces) {
    const fw = ((face.xmax - face.xmin) / 1000) * W;
    const fh = ((face.ymax - face.ymin) / 1000) * H;
    const x = Math.max(0, Math.floor((face.xmin / 1000) * W - fw * 0.2));
    const y = Math.max(0, Math.floor((face.ymin / 1000) * H - fh * 0.2));
    const w = Math.min(W - x, Math.ceil(fw * 1.4));
    const h = Math.min(H - y, Math.ceil(fh * 1.4));
    if (w <= 0 || h <= 0) continue;

    const block = Math.max(8, Math.round(Math.max(w, h) / 8));
    const small = canvasFor(Math.max(1, Math.round(w / block)), Math.max(1, Math.round(h / block)));
    small.ctx.drawImage(canvas, x, y, w, h, 0, 0, small.canvas.width, small.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small.canvas, 0, 0, small.canvas.width, small.canvas.height, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  }
  return canvas.toDataURL("image/jpeg", 0.8);
}

/** 64-bit difference hash as 16 hex chars. Near-identical photos have near-identical hashes. */
export async function dHash(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const { ctx } = canvasFor(9, 8);
  ctx.drawImage(img, 0, 0, 9, 8);
  const { data } = ctx.getImageData(0, 0, 9, 8);
  const grey = (i: number) =>
    (data[i * 4] ?? 0) * 0.299 + (data[i * 4 + 1] ?? 0) * 0.587 + (data[i * 4 + 2] ?? 0) * 0.114;

  let bits = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      bits += grey(row * 9 + col) > grey(row * 9 + col + 1) ? "1" : "0";
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += Number.parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

export function hammingHex(a: string, b: string): number {
  let distance = 0;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    let x = Number.parseInt(a[i] ?? "0", 16) ^ Number.parseInt(b[i] ?? "0", 16);
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}
