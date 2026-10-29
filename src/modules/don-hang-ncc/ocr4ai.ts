/**
 * Tích hợp Ocr4AI (https://ocr.laychu.com/api-docs#models)
 *
 * Dịch vụ OCR siêu tốc chuyên biệt cho tiếng Việt & ứng dụng AI:
 * - Chuẩn OpenAI-compatible: POST /v1/chat/completions
 * - Model: ocr4ai-fast
 * - Hỗ trợ xuất định dạng Markdown (giữ nguyên cấu trúc bảng biểu) hoặc plain text
 * - Tốc độ trung bình: 300 - 600ms/ảnh
 */

export const OCR4AI_DEFAULT_BASE_URL = 'https://ocr.laychu.com/v1';
export const OCR4AI_PROXY_BASE_URL = '/api/ocr4ai';
export const OCR4AI_DEFAULT_MODEL = 'ocr4ai-fast';
export const OCR4AI_DOCS_URL = 'https://ocr.laychu.com/api-docs#models';
export const OCR4AI_REGISTER_URL = 'https://ocr.laychu.com';

const STORAGE_KEY = 'hkt_ocr4ai_config';

export interface Ocr4AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  ocrFormat: 'markdown' | 'text';
}

export interface Ocr4AiResult {
  text: string;
  markdown: string;
  model: string;
  elapsedMs?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  billingUsd?: string;
}

export function loadOcr4AiConfig(): Ocr4AiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Ocr4AiConfig>;
    if (!parsed.apiKey?.trim()) return null;
    return {
      apiKey: parsed.apiKey.trim(),
      baseUrl: (parsed.baseUrl || OCR4AI_DEFAULT_BASE_URL).trim(),
      model: (parsed.model || OCR4AI_DEFAULT_MODEL).trim(),
      ocrFormat: parsed.ocrFormat === 'text' ? 'text' : 'markdown',
    };
  } catch {
    return null;
  }
}

export function saveOcr4AiConfig(config: Ocr4AiConfig | null): void {
  try {
    if (!config || !config.apiKey.trim()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        apiKey: config.apiKey.trim(),
        baseUrl: (config.baseUrl || OCR4AI_DEFAULT_BASE_URL).trim(),
        model: (config.model || OCR4AI_DEFAULT_MODEL).trim(),
        ocrFormat: config.ocrFormat === 'text' ? 'text' : 'markdown',
      }),
    );
  } catch {
    /* bỏ qua khi trình duyệt chặn localStorage */
  }
}

interface PreparedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

/**
 * Nén & thu nhỏ ảnh để đảm bảo dưới giới hạn 10MB / 20M pixel của Ocr4AI
 */
export async function prepareImageForOcr4Ai(src: string): Promise<PreparedImage> {
  if (!src.startsWith('data:')) {
    const blob = await (await fetch(src)).blob();
    const dataUrl = await blobToDataUrl(blob);
    return prepareImageForOcr4Ai(dataUrl);
  }

  const img = await loadImage(src);
  const maxSize = 2400; // Ocr4AI hỗ trợ ảnh chi tiết cao
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const base64 = src.split(',')[1] || '';
    const mimeMatch = src.match(/^data:([^;]+);/);
    return { dataUrl: src, base64, mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg' };
  }

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const base64 = dataUrl.split(',')[1] || '';

  return { dataUrl, base64, mimeType: 'image/jpeg' };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không nạp được ảnh vào bộ nhớ'));
    img.src = src;
  });
}

function mapOcr4AiError(status: number, data: any): string {
  const code = data?.error?.code || data?.code || '';
  const message = data?.error?.message || data?.message || '';

  if (status === 401 || code === 'invalid_api_key') {
    return 'API key Ocr4AI không hợp lệ hoặc chưa được kích hoạt. Vui lòng kiểm tra lại tại ocr.laychu.com.';
  }
  if (status === 402 || code === 'insufficient_quota' || code === 'out_of_credits') {
    return 'Tài khoản Ocr4AI đã hết số dư (credit). Vui lòng nạp thêm tại ocr.laychu.com.';
  }
  if (status === 404 || code === 'model_not_found') {
    return 'Model Ocr4AI không tồn tại. Vui lòng dùng model "ocr4ai-fast".';
  }
  if (status === 413 || code === 'file_too_large' || code === 'image_too_large') {
    return 'Ảnh quá lớn (vượt quá giới hạn 10MB hoặc 20 triệu pixel của Ocr4AI).';
  }
  if (status === 429 || code === 'queue_full' || code === 'daily_image_limit') {
    return 'Hàng đợi Ocr4AI đang bận hoặc tài khoản miễn phí đã đạt giới hạn 100 ảnh/ngày. Vui lòng thử lại sau.';
  }
  if (status === 500 || status === 503) {
    return 'Máy chủ Ocr4AI tạm thời gián đoạn. Vui lòng thử lại sau vài giây.';
  }

  return message ? `Lỗi Ocr4AI (${status}): ${message}` : `Lỗi gọi API Ocr4AI (HTTP ${status})`;
}

/**
 * Thực hiện gọi API Ocr4AI (/v1/chat/completions)
 * Tự động chuyển hướng qua Vite proxy nếu gọi trực tiếp bị chặn CORS ở trình duyệt.
 */
export async function readInvoiceWithOcr4Ai(
  imageSrc: string,
  config?: Partial<Ocr4AiConfig>,
): Promise<Ocr4AiResult> {
  const saved = loadOcr4AiConfig();
  const apiKey = (config?.apiKey || saved?.apiKey || '').trim();
  if (!apiKey) {
    throw new Error('Chưa có API key Ocr4AI. Vui lòng nhập key trong mục Cấu hình engine.');
  }

  const model = (config?.model || saved?.model || OCR4AI_DEFAULT_MODEL).trim();
  const format = config?.ocrFormat || saved?.ocrFormat || 'markdown';
  const configuredBase = (config?.baseUrl || saved?.baseUrl || OCR4AI_DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

  const prepared = await prepareImageForOcr4Ai(imageSrc);

  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${prepared.mimeType};base64,${prepared.base64}`,
            },
          },
        ],
      },
    ],
    ocr_format: format,
    stream: false,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // Các URL đích có thể thử: ưu tiên URL cấu hình, nếu bị lỗi CORS trong browser thì fallback sang proxy nội bộ
  const candidateUrls: string[] = [];
  candidateUrls.push(`${configuredBase}/chat/completions`);

  // Nếu người dùng đang dùng URL gốc https://ocr.laychu.com/v1 thì thêm fallback proxy Vite
  if (configuredBase.includes('ocr.laychu.com')) {
    candidateUrls.push(`${OCR4AI_PROXY_BASE_URL}/chat/completions`);
  }

  let lastError: Error | null = null;

  for (const targetUrl of candidateUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(`Ocr4AI trả về dữ liệu không hợp lệ: ${rawText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(mapOcr4AiError(res.status, data));
      }

      const content = data?.choices?.[0]?.message?.content || '';
      if (!content || !content.trim()) {
        throw new Error('Ocr4AI không nhận diện được chữ nào trên ảnh (ảnh quá mờ hoặc trống).');
      }

      const ocrMeta = data?.ocr || {};
      const usage = data?.usage || {};

      return {
        text: content.trim(),
        markdown: content.trim(),
        model: data?.model || model,
        elapsedMs: ocrMeta?.elapsed_ms,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        billingUsd: ocrMeta?.billing?.total_usd,
      };
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Nếu là lỗi CORS (Failed to fetch / NetworkError) và còn URL dự phòng (proxy) thì tiếp tục thử
      const isCorsOrNetwork =
        err?.name === 'TypeError' ||
        String(err?.message || '').toLowerCase().includes('fetch') ||
        String(err?.message || '').toLowerCase().includes('network');

      if (isCorsOrNetwork && candidateUrls.indexOf(targetUrl) < candidateUrls.length - 1) {
        console.warn(`[Ocr4AI] Gọi trực tiếp ${targetUrl} gặp vấn đề mạng/CORS, tự động thử proxy...`);
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Không thể kết nối tới dịch vụ Ocr4AI.');
}
