/**
 * Đọc hóa đơn bằng OCR.space (OCR Cloud).
 *
 * - Ảnh được thu nhỏ + nén JPEG trước khi gửi để nằm dưới giới hạn 1MB của gói miễn phí.
 * - Engine 2 tự nhận diện tiếng Việt, isTable=true để tách dòng theo bảng.
 * - Chỉ trả về văn bản thô; việc bóc tách tên hàng / số lượng do imageParser đảm nhận.
 */

export const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

/** Key dùng thử công khai của OCR.space (giới hạn lượt gọi, dùng chung toàn cầu) */
export const OCR_SPACE_TEST_KEY = 'helloworld';

export const OCR_SPACE_KEY_URL = 'https://ocr.space/ocrapi/freekey';

const STORAGE_KEY = 'hkt_ocrspace_key';

/** Giới hạn an toàn sau khi mã hoá base64 (gói free giới hạn 1MB) */
const MAX_UPLOAD_BYTES = 700 * 1024;

export interface OcrSpaceResult {
  text: string;
  /** OCR chỉ đọc được một phần ảnh */
  partial: boolean;
  processingTimeMs?: number;
}

export function loadOcrSpaceKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveOcrSpaceKey(key: string | null): void {
  try {
    const value = (key || '').trim();
    if (!value) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* bỏ qua khi trình duyệt chặn localStorage */
  }
}

/** Đọc hóa đơn qua OCR.space, trả về văn bản thô */
export async function readInvoiceWithOcrSpace(imageSrc: string, apiKey?: string): Promise<OcrSpaceResult> {
  const key = (apiKey || loadOcrSpaceKey() || OCR_SPACE_TEST_KEY).trim();
  const dataUrl = await prepareImageForUpload(imageSrc);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110000);

  try {
    const form = new FormData();
    form.append('base64Image', dataUrl);
    form.append('language', 'auto');
    form.append('OCREngine', '2');
    form.append('isTable', 'true');
    form.append('scale', 'true');
    form.append('detectOrientation', 'true');
    form.append('isOverlayRequired', 'false');

    const res = await fetch(OCR_SPACE_ENDPOINT, {
      method: 'POST',
      headers: { apikey: key },
      body: form,
      signal: controller.signal,
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new Error(`OCR.space trả về dữ liệu lạ${raw ? `: ${raw.slice(0, 120)}` : ''}`);
    }

    if (!res.ok) {
      throw new Error(mapHttpError(res.status, data));
    }

    if (data?.IsErroredOnProcessing) {
      throw new Error(friendlyError(pickErrorMessage(data)));
    }

    const results: any[] = Array.isArray(data?.ParsedResults) ? data.ParsedResults : [];
    const perFileError = results.find((r) => r?.ErrorMessage && !String(r?.ParsedText || '').trim());
    if (perFileError) {
      throw new Error(friendlyError(String(perFileError.ErrorMessage)));
    }

    const text = results
      .map((r) => String(r?.ParsedText || ''))
      .join('\n')
      .replace(/\r\n?/g, '\n')
      .trim();

    if (!text) throw new Error('OCR.space không đọc được chữ nào trong ảnh (ảnh mờ hoặc quá nghiêng).');

    const exitCode = Number(data?.OCRExitCode);
    return {
      text,
      partial: exitCode === 2,
      processingTimeMs: Number(data?.ProcessingTimeInMilliseconds) || undefined,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('OCR.space phản hồi quá lâu. Thử lại hoặc dùng Tesseract.');
    }
    if (err instanceof TypeError) {
      throw new Error('Không kết nối được tới OCR.space. Kiểm tra mạng hoặc chặn quảng cáo.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function pickErrorMessage(data: any): string {
  const raw = data?.ErrorMessage ?? data?.ErrorDetails;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(' ');
  if (raw && typeof raw === 'object') return JSON.stringify(raw);
  return String(raw || 'OCR.space báo lỗi không xác định.');
}

function mapHttpError(status: number, data: any): string {
  const message = pickErrorMessage(data);
  if (status === 401 || status === 403) return 'API key OCR.space không hợp lệ hoặc đã bị khoá.';
  if (status === 429) return 'OCR.space đã hết lượt miễn phí hôm nay. Nhập key riêng hoặc dùng Tesseract.';
  if (status === 413) return 'Ảnh quá lớn so với giới hạn của OCR.space.';
  return friendlyError(message) || `OCR.space lỗi (${status}).`;
}

/** Dịch các thông báo tiếng Anh thường gặp của OCR.space */
function friendlyError(message: string): string {
  const msg = (message || '').trim();
  const lower = msg.toLowerCase();

  if (!msg) return 'OCR.space báo lỗi không xác định.';
  if (/api\s*key|apikey|e101|e102|unauthori[sz]ed|forbidden/.test(lower)) {
    return 'API key OCR.space không hợp lệ. Lấy key miễn phí tại ocr.space/ocrapi/freekey.';
  }
  if (/rate limit|too many|limit reached|quota|exceed/.test(lower)) {
    return 'OCR.space đã hết lượt miễn phí (500 lượt/ngày). Thử lại sau hoặc dùng key riêng.';
  }
  if (/too large|file size|1\s*mb|maximum.*size/.test(lower)) {
    return 'Ảnh quá lớn so với giới hạn 1MB của OCR.space.';
  }
  if (/timed?\s*out|timeout|try again/.test(lower)) {
    return 'OCR.space xử lý quá lâu, thử lại với ảnh rõ hơn.';
  }
  if (/unable to recognize|no text|not.*text|invalid image|corrupt/.test(lower)) {
    return 'OCR.space không đọc được chữ trong ảnh này (ảnh mờ, nghiêng hoặc thiếu sáng).';
  }
  return `OCR.space: ${msg}`;
}

/** Thu nhỏ + nén ảnh cho vừa giới hạn upload của OCR.space */
async function prepareImageForUpload(src: string): Promise<string> {
  let source = src;

  if (!source.startsWith('data:')) {
    try {
      const blob = await (await fetch(source)).blob();
      source = await blobToDataUrl(blob);
    } catch {
      throw new Error('Không tải được ảnh để gửi OCR.space.');
    }
  }

  const img = await loadImage(source);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  let width = Math.max(1, Math.round(img.naturalWidth * scale));
  let height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;

  // Nền trắng để ảnh PNG trong suốt không thành nền đen khi nén JPEG
  const render = (w: number, h: number, quality: number): string => {
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  };

  for (const quality of [0.92, 0.85, 0.78, 0.7]) {
    const dataUrl = render(width, height, quality);
    if (estimateBytes(dataUrl) <= MAX_UPLOAD_BYTES) return dataUrl;
  }

  // Vẫn quá lớn: giảm dần kích thước ảnh
  for (let attempt = 0; attempt < 3; attempt++) {
    width = Math.max(640, Math.round(width * 0.75));
    height = Math.max(480, Math.round(height * 0.75));
    const dataUrl = render(width, height, 0.78);
    if (estimateBytes(dataUrl) <= MAX_UPLOAD_BYTES) return dataUrl;
  }

  return render(width, height, 0.7);
}

function estimateBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.ceil((base64.length * 3) / 4);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được ảnh'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không đọc được ảnh'));
    img.src = src;
  });
}
