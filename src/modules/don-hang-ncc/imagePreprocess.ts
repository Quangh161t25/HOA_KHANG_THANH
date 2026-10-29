/**
 * Tiền xử lý ảnh hóa đơn trước khi đưa vào OCR.
 *
 * Ảnh chụp/màn hình hóa đơn nhà vườn thường:
 *  - Có nhiều viền trắng thừa => chữ bị thu nhỏ tương đối.
 *  - Cỡ chữ nhỏ (10-14px) => Tesseract đọc sai dấu, dính cột.
 *  - Có khung kẻ bảng => Tesseract gộp chữ ở các ô khác cột vào một "từ".
 *
 * Các bước: cắt viền trắng → phóng to → chuyển xám + tăng tương phản → xóa đường kẻ bảng.
 */
export async function preprocessInvoiceImage(src: string): Promise<string> {
  const img = await loadImage(src);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  if (!naturalWidth || !naturalHeight) return src;

  // 1. Vẽ ảnh gốc để tìm vùng có nội dung (bỏ viền trắng)
  const srcCanvas = createCanvas(naturalWidth, naturalHeight);
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return src;
  srcCtx.drawImage(img, 0, 0);

  const srcData = srcCtx.getImageData(0, 0, naturalWidth, naturalHeight);
  const box = findContentBox(srcData, naturalWidth, naturalHeight);

  // 2. Cắt + phóng to sao cho chiều rộng ~1600px (tối đa 4x, tối đa 3200px)
  const cropW = Math.max(1, box.width);
  const cropH = Math.max(1, box.height);
  let scale = Math.min(4, Math.max(1, 1600 / cropW));
  if (cropW * scale > 3200) scale = 3200 / cropW;
  if (cropH * scale > 4600) scale = 4600 / cropH;

  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(srcCanvas, box.x, box.y, cropW, cropH, 0, 0, outW, outH);

  const imageData = ctx.getImageData(0, 0, outW, outH);
  const data = imageData.data;
  const gray = new Uint8ClampedArray(outW * outH);

  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
  }

  // 3. Tăng tương phản theo phân vị 2% - 98% và làm nét chữ
  stretchContrast(gray);
  sharpen(gray, outW, outH);

  // 4. Xóa đường kẻ bảng: đường ngang/dọc rất dài gần như liền mạch
  removeTableLines(gray, outW, outH);

  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    data[p] = gray[i];
    data[p + 1] = gray[i];
    data[p + 2] = gray[i];
    data[p + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không đọc được ảnh'));
    img.src = src;
  });
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Tìm vùng ảnh có chữ (pixel sẫm), bỏ viền trắng xung quanh */
function findContentBox(imageData: ImageData, width: number, height: number): Box {
  const data = imageData.data;
  const isInk = (x: number, y: number) => {
    const p = (y * width + x) * 4;
    return 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2] < 200;
  };

  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  // Quét thưa 2 pixel để nhanh với ảnh lớn
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (!isInk(x, y)) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0 || bottom < 0) return { x: 0, y: 0, width, height };

  const pad = Math.round(Math.min(width, height) * 0.01) + 4;
  const x = Math.max(0, left - pad);
  const y = Math.max(0, top - pad);
  const w = Math.min(width - x, right - left + pad * 2 + 1);
  const h = Math.min(height - y, bottom - top + pad * 2 + 1);

  return { x, y, width: Math.max(1, w), height: Math.max(1, h) };
}

/**
 * Kéo giãn dải sáng theo phân vị 2% - 98% để chữ đậm, nền trắng
 */
function stretchContrast(gray: Uint8ClampedArray): void {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  const lowTarget = total * 0.02;
  const highTarget = total * 0.98;

  let acc = 0;
  let low = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= lowTarget) {
      low = v;
      break;
    }
  }

  acc = 0;
  let high = 255;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= highTarget) {
      high = v;
      break;
    }
  }

  if (high - low < 20) return;

  const range = high - low;
  for (let i = 0; i < gray.length; i++) {
    const v = ((gray[i] - low) / range) * 255;
    gray[i] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  }
}

/**
 * Làm nét chữ (unsharp mask nhẹ) sau khi phóng to ảnh nhỏ.
 * Giúp Tesseract nhận đúng dấu tiếng Việt và chữ số.
 */
function sharpen(gray: Uint8ClampedArray, width: number, height: number): void {
  const src = new Uint8ClampedArray(gray);
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const i = row + x;
      const around = (src[i - 1] + src[i + 1] + src[i - width] + src[i + width]) / 4;
      const v = src[i] + 0.8 * (src[i] - around);
      gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}

/**
 * Xóa các đường kẻ khung bảng (ngang/dọc dài, gần như liền mạch).
 * Nhờ vậy Tesseract tách được từng ô, không dính "4" với "38,000".
 */
function removeTableLines(gray: Uint8ClampedArray, width: number, height: number): void {
  const threshold = otsuThreshold(gray);
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < ink.length; i++) ink[i] = gray[i] < threshold ? 1 : 0;

  const hMin = Math.max(40, Math.round(width * 0.22));
  const vMin = Math.max(40, Math.round(height * 0.05));

  // Đường ngang
  for (let y = 0; y < height; y++) {
    let run = 0;
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (ink[row + x]) {
        run++;
        continue;
      }
      if (run >= hMin) {
        for (let k = x - run; k < x; k++) gray[row + k] = 255;
      }
      run = 0;
    }
    if (run >= hMin) {
      for (let k = width - run; k < width; k++) gray[row + k] = 255;
    }
  }

  // Đường dọc
  for (let x = 0; x < width; x++) {
    let run = 0;
    for (let y = 0; y < height; y++) {
      if (ink[y * width + x]) {
        run++;
        continue;
      }
      if (run >= vMin) {
        for (let k = y - run; k < y; k++) gray[k * width + x] = 255;
      }
      run = 0;
    }
    if (run >= vMin) {
      for (let k = height - run; k < height; k++) gray[k * width + x] = 255;
    }
  }
}

/** Ngưỡng nhị phân Otsu (tự thích ứng cho ảnh chụp thiếu sáng) */
function otsuThreshold(gray: Uint8ClampedArray): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v];

  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let threshold = 128;

  for (let v = 0; v < 256; v++) {
    weightB += hist[v];
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;
    sumB += v * hist[v];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (between > best) {
      best = between;
      threshold = v;
    }
  }

  return threshold;
}
