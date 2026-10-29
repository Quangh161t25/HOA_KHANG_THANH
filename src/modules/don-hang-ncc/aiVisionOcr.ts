import type { Flower } from '@/types/hoaKhangThanh';
import { findBestMatchingFlower, type ParsedFlowerItem } from './imageParser';

export type AiProvider = 'gemini' | 'openai';

export interface AiOcrConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  /** Chỉ dùng cho provider 'openai' (OpenAI, OpenRouter, Groq, Ollama, LM Studio...) */
  baseUrl: string;
}

export interface AiDraftItem {
  name: string;
  quantity: number;
  unit?: string;
}

const STORAGE_KEY = 'hkt_ai_ocr_config';

export const AI_PROVIDER_DEFAULTS: Record<AiProvider, { model: string; baseUrl: string; label: string; keyUrl: string }> = {
  gemini: {
    label: 'Google Gemini',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  openai: {
    label: 'OpenAI / tương thích',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
};

export function loadAiOcrConfig(): AiOcrConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AiOcrConfig>;
    if (!parsed.apiKey || !parsed.provider) return null;
    const defaults = AI_PROVIDER_DEFAULTS[parsed.provider] || AI_PROVIDER_DEFAULTS.gemini;
    return {
      provider: parsed.provider === 'openai' ? 'openai' : 'gemini',
      apiKey: parsed.apiKey,
      model: parsed.model || defaults.model,
      baseUrl: parsed.baseUrl || defaults.baseUrl,
    };
  } catch {
    return null;
  }
}

export function saveAiOcrConfig(config: AiOcrConfig | null): void {
  try {
    if (!config || !config.apiKey.trim()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* bỏ qua khi trình duyệt chặn localStorage */
  }
}

const EXTRACT_PROMPT = `Bạn là hệ thống đọc hóa đơn / phiếu bán hoa của nhà vườn Việt Nam.
Nhiệm vụ: trích xuất CHỈ danh sách mặt hàng trong bảng của hóa đơn.

Quy tắc bắt buộc:
- Mỗi dòng hàng trả về gồm: tên hàng (name), đơn vị tính (unit), số lượng (quantity).
- "Tên hàng" giữ đúng như hóa đơn nhưng BỎ phần đơn vị/quy cách dính trong ô tên (ví dụ "thảo tím kg" => "thảo tím").
- "Số lượng" là số ở cột SL, KHÔNG lấy đơn giá, thành tiền, tổng cộng, công nợ.
- Đơn vị tính lấy ở cột ĐVT (kg, Cành, Bó, Cây, Chậu, Nhánh...). Nếu hóa đơn không ghi thì để chuỗi rỗng.
- Bỏ qua hoàn toàn: đơn giá, thành tiền, tổng cộng, công nợ cũ, khách thanh toán, công nợ còn lại, thông tin người bán/người mua, địa chỉ, điện thoại, mã hóa đơn, ngày giờ, chữ ký, QR, bằng chữ.
- Không bịa thêm dòng. Nếu ảnh không có bảng hàng thì trả mảng rỗng.
- Số lượng phải là số thực tế của dòng hàng (thường rất nhỏ so với giá tiền).

Chỉ trả về JSON đúng định dạng:
{"items":[{"name":"thảo tím","unit":"kg","quantity":4}]}`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          unit: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
        },
        required: ['name', 'quantity'],
      },
    },
  },
  required: ['items'],
};

interface PreparedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

/** Thu nhỏ ảnh trước khi gửi API để giảm dung lượng (giữ tối đa 1600px) */
async function prepareImage(src: string): Promise<PreparedImage> {
  if (!src.startsWith('data:')) {
    // Ảnh từ URL: tải về rồi xử lý như ảnh thường
    const blob = await (await fetch(src)).blob();
    const dataUrl = await blobToDataUrl(blob);
    return prepareImage(dataUrl);
  }

  const img = await loadImage(src);
  const maxSize = 1600;
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: src, base64: src.split(',')[1] || '', mimeType: 'image/png' };

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return { dataUrl, base64: dataUrl.split(',')[1] || '', mimeType: 'image/jpeg' };
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

/** Gọi API AI vision và trả về danh sách mặt hàng thô */
export async function readInvoiceWithAI(imageSrc: string, config: AiOcrConfig): Promise<AiDraftItem[]> {
  const image = await prepareImage(imageSrc);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const text =
      config.provider === 'gemini'
        ? await callGemini(image, config, controller.signal)
        : await callOpenAiCompatible(image, config, controller.signal);
    return normalizeAiItems(parseJsonLoosely(text));
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(image: PreparedImage, config: AiOcrConfig, signal: AbortSignal): Promise<string> {
  const base = (config.baseUrl || AI_PROVIDER_DEFAULTS.gemini.baseUrl).replace(/\/+$/, '');
  const model = config.model || AI_PROVIDER_DEFAULTS.gemini.model;
  const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: EXTRACT_PROMPT }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(apiErrorMessage(data, res.status));

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p?.text || '').join('') : '';
  if (!text.trim()) throw new Error('AI không trả về nội dung (ảnh có thể bị chặn hoặc quá mờ).');
  return text;
}

async function callOpenAiCompatible(image: PreparedImage, config: AiOcrConfig, signal: AbortSignal): Promise<string> {
  const base = (config.baseUrl || AI_PROVIDER_DEFAULTS.openai.baseUrl).replace(/\/+$/, '');
  const model = config.model || AI_PROVIDER_DEFAULTS.openai.model;

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Đọc hóa đơn trong ảnh và trả về JSON theo đúng định dạng đã mô tả.' },
            { type: 'image_url', image_url: { url: image.dataUrl } },
          ],
        },
      ],
    }),
  });

  const data = await readJsonSafe(res);
  if (!res.ok) throw new Error(apiErrorMessage(data, res.status));

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((c: { text?: string }) => c?.text || '').join('') : '';
  if (!text.trim()) throw new Error('AI không trả về nội dung (ảnh có thể bị chặn hoặc quá mờ).');
  return text;
}

async function readJsonSafe(res: Response): Promise<any> {
  const raw = await res.text();
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return { raw };
  }
}

function apiErrorMessage(data: any, status: number): string {
  const message: string =
    data?.error?.message || data?.message || (typeof data?.raw === 'string' ? data.raw.slice(0, 200) : '');

  if (status === 400 && /api key|api_key|key not valid/i.test(message)) return 'API key không hợp lệ.';
  if (status === 401 || status === 403) return 'API key sai hoặc không có quyền truy cập.';
  if (status === 404) return 'Không tìm thấy model. Kiểm tra lại tên model.';
  if (status === 429) return 'Đã hết hạn mức (quota) của API. Thử lại sau hoặc đổi key.';
  if (status >= 500) return 'Máy chủ AI đang lỗi. Thử lại sau ít phút.';

  return message || `Lỗi API (${status}).`;
}

/** Bóc JSON kể cả khi model bọc trong ```json ... ``` */
function parseJsonLoosely(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI trả về dữ liệu không phải JSON hợp lệ.');
  }
}

/** Chuẩn hóa nhiều kiểu JSON khác nhau thành danh sách mặt hàng */
export function normalizeAiItems(payload: any): AiDraftItem[] {
  const list: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.products)
          ? payload.products
          : [];

  const items: AiDraftItem[] = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;

    const name = String(
      raw.name ?? raw.ten ?? raw.ten_hang ?? raw.tenHang ?? raw.product ?? raw.item ?? '',
    ).trim();

    const unit = String(raw.unit ?? raw.dvt ?? raw.don_vi ?? raw.donVi ?? raw.uom ?? '').trim();

    const rawQty = raw.quantity ?? raw.so_luong ?? raw.soLuong ?? raw.sl ?? raw.qty ?? raw.amount;
    const quantity = typeof rawQty === 'number' ? rawQty : Number(String(rawQty ?? '').replace(/[^\d.,-]/g, '').replace(/,/g, '.'));

    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue;
    items.push({ name, quantity, unit: unit || undefined });
  }

  return items;
}

/** Đổi kết quả AI thành ParsedFlowerItem (ghép danh mục hoa để lấy mã/giá vốn) */
export function draftsToParsedItems(drafts: AiDraftItem[], flowers: Flower[]): ParsedFlowerItem[] {
  return drafts.map((draft, index) => {
    const matched = findBestMatchingFlower(draft.name, flowers);
    const unit = draft.unit || matched?.unit || 'Cành';

    return {
      id: `ai-${Date.now()}-${index}`,
      flowerName: matched ? matched.name : draft.name,
      flowerCode: matched ? matched.code : `HOA-${String(100 + index)}`,
      customName: matched?.customName || draft.name,
      matchedFlowerId: matched?.id,
      quantity: draft.quantity,
      costPrice: matched?.costPrice || 0,
      unit,
      confidence: 'high' as const,
      rawName: draft.name,
    };
  });
}

/** Hiển thị kết quả AI trong ô "văn bản nhận diện" để người dùng xem/sửa */
export function draftsToEditableText(drafts: AiDraftItem[]): string {
  return drafts
    .map((item, index) => `${index + 1} ${item.name} ${item.unit || ''} ${item.quantity}`.replace(/\s+/g, ' ').trim())
    .join('\n');
}
