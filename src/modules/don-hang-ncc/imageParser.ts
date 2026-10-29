import type { Flower, SupplierOrderItem } from '@/types/hoaKhangThanh';

export interface ParsedFlowerItem {
  id: string;
  flowerName: string;
  flowerCode: string;
  customName: string;
  matchedFlowerId?: string;
  quantity: number;
  costPrice: number;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
  /** Tên đọc được nguyên bản trên hóa đơn (trước khi ghép danh mục) */
  rawName?: string;
}

/** Bỏ dấu tiếng Việt + chữ thường, dùng để so khớp với văn bản OCR */
export function normalizeVi(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIT_ALIASES: Record<string, string> = {
  kg: 'kg',
  ky: 'kg',
  kilogam: 'kg',
  kq: 'kg',
  ka: 'kg',
  k9: 'kg',
  kí: 'kg',
  'ki-lo-gam': 'kg',
  g: 'g',
  gam: 'g',
  canh: 'Cành',
  nhanh: 'Nhánh',
  bo: 'Bó',
  cay: 'Cây',
  chau: 'Chậu',
  hop: 'Hộp',
  goi: 'Gói',
  tai: 'Tai',
  cap: 'Cặp',
  bong: 'Bông',
  chum: 'Chùm',
  thung: 'Thùng',
  tam: 'Tấm',
  met: 'Mét',
  la: 'Lá',
  binh: 'Bình',
  giap: 'Giạp',
};

const NON_ITEM_LINE_PREFIXES = [
  'stt',
  'ten hang',
  'ten san pham',
  'quy cach',
  'don vi',
  'dvt',
  'so luong',
  'sl',
  'don gia',
  'thanh tien',
  'thanh toan',
  'tong cong',
  'tong tien',
  'tong thanh toan',
  'cong no',
  'no cu',
  'khach hang',
  'khach thanh toan',
  'da thanh toan',
  'con no',
  'chiet khau',
  'giam gia',
  'tru hang',
  'cuoc',
  'van chuyen',
  'ngay ',
  'ngay:',
  'so hd',
  'so hoa don',
  'hd',
  'hoa don',
  'phieu',
  'dia chi',
  'dien thoai',
  'sdt',
  'tel',
  'fax',
  'email',
  'ma so thue',
  'mst',
  'nguoi',
  'ke toan',
  'nguoi ban',
  'bang chu',
  'lien he',
  'cam on',
  'qr',
  'ghi chu',
];

function isNonItemName(name: string): boolean {
  const n = normalizeVi(name).replace(/^[-–•*+]\s*/, '');
  if (!n) return true;
  if (!/[a-z]/.test(n)) return true;
  return NON_ITEM_LINE_PREFIXES.some((prefix) => n === prefix || n.startsWith(prefix));
}

/** Kiểm tra token có nguyên âm (tiếng Việt luôn có nguyên âm) */
function hasVowel(token: string): boolean {
  return /[aeiouy]/.test(normalizeVi(token));
}

function cleanItemName(name: string): string {
  const tokens = name
    // Bỏ ký tự rác do OCR sinh ra khi quét khung bảng
    .replace(/[[\]{}()<>|¦│┃“”"'`~^*_=+\\/;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  // Bỏ ĐVT bị dính vào cuối tên và các mẩu rác 1-3 ký tự không có nguyên âm
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    const isUnit = !!unitTokenInfo(last);
    const isNoise = last.length <= 3 && !hasVowel(last);
    // Ký tự đơn lẻ ở cuối gần như luôn là rác OCR của cột ĐVT (vd "thảo tím o")
    const isSingleNoise = last.length === 1;
    if (!isUnit && !isNoise && !isSingleNoise) break;
    tokens.pop();
  }

  return tokens
    .join(' ')
    .replace(/^[\s\-–•*+:.,]+|[\s\-–•*+:.,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tên hàng hợp lệ: có chữ, không lẫn số/ký tự rác từ OCR */
function isValidItemName(name: string): boolean {
  if (name.length < 2) return false;
  if (/\d/.test(name)) return false;
  if (!/[a-zA-ZÀ-ỹ]{2}/.test(name)) return false;
  return !isNonItemName(name);
}

/** Số lượng hợp lý cho một dòng hoa (loại bỏ số tiền bị đọc nhầm thành SL) */
function isValidQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0 && quantity < 20000;
}

interface UnitTokenInfo {
  unit: string;
  /** Số lượng bị dính liền với ĐVT, ví dụ "4kg" */
  quantity?: number;
}

function unitTokenInfo(token: string): UnitTokenInfo | undefined {
  const key = normalizeVi(token).replace(/[.,;:()[\]]/g, '').trim();
  if (!key) return undefined;
  if (UNIT_ALIASES[key]) return { unit: UNIT_ALIASES[key] };

  const attached = key.match(/^(\d+)([a-z-]+)$/);
  if (attached && UNIT_ALIASES[attached[2]]) {
    return { unit: UNIT_ALIASES[attached[2]], quantity: parseViNumber(attached[1]) };
  }
  return undefined;
}

function isNumericToken(token: string): boolean {
  return /^\d[\d.,]*$/.test(token.replace(/[^\d.,]/g, ''));
}

/**
 * Suy ra số lượng từ đơn giá + thành tiền khi OCR bỏ sót cột SL.
 * Chỉ nhận khi phép chia gần như chẵn (sai lệch < 2%) để tránh số lượng sai.
 */
function deriveQuantityFromMoney(price: number, total: number): number | null {
  if (!(price >= 100) || !(total > price)) return null;
  const raw = total / price;
  if (!Number.isFinite(raw) || raw <= 0 || raw >= 20000) return null;

  const rounded = Math.round(raw);
  if (rounded < 1) return null;
  if (Math.abs(raw - rounded) > 0.02) return null;
  if (Math.abs(rounded * price - total) > Math.max(1, total * 0.02)) return null;

  return rounded;
}

/** Đọc số kiểu Việt Nam: 38.000 / 38,000 / 26.509.000 / 4,5 */
export function parseViNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;

  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return Number(cleaned.replace(/,/g, '')) || 0;
  }

  if (lastComma !== -1) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length !== 3) {
      return Number(cleaned.replace(',', '.')) || 0;
    }
    return Number(parts.join('')) || 0;
  }

  if (lastDot !== -1) {
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length !== 3) {
      return Number(cleaned) || 0;
    }
    return Number(parts.join('')) || 0;
  }

  return Number(cleaned) || 0;
}

/**
 * Thuật toán tìm loại hoa khớp nhất trong danh mục hoa hiện có của hệ thống
 */
export function findBestMatchingFlower(keyword: string, flowers: Flower[]): Flower | undefined {
  if (!keyword) return undefined;
  const kw = keyword.toLowerCase().trim();
  const kwNorm = normalizeVi(keyword);

  const aliasesOf = (f: Flower) =>
    (f.customName || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  // 1. Khớp chính xác tên riêng (biệt danh), tên hoa hoặc mã hoa
  for (const f of flowers) {
    if (f.code.toLowerCase() === kw) return f;
    if (f.name.toLowerCase() === kw || normalizeVi(f.name) === kwNorm) return f;
    const aliases = aliasesOf(f);
    if (aliases.some((a) => a.toLowerCase() === kw || normalizeVi(a) === kwNorm)) return f;
  }

  // 2. Khớp chuỗi con trong tên riêng (bỏ dấu để chịu được lỗi OCR)
  for (const f of flowers) {
    const aliases = aliasesOf(f).map((a) => normalizeVi(a));
    if (aliases.some((a) => a.length >= 3 && (kwNorm.includes(a) || a.includes(kwNorm)))) {
      return f;
    }
  }

  // 3. Khớp chuỗi con trong tên hoa chính thức
  for (const f of flowers) {
    const fName = f.name.toLowerCase();
    const fNorm = normalizeVi(f.name);
    if (kw.includes(fName) || fName.includes(kw) || (kwNorm.length >= 4 && fNorm.includes(kwNorm))) {
      return f;
    }
  }

  // 4. Khớp từ khóa cốt lõi
  const keywords = ['hồng đỏ', 'hồng kem', 'hồng vàng', 'ly vàng', 'ly đỏ', 'cúc mẫu đơn', 'hồ điệp', 'baby', 'họa mi', 'đồng tiền', 'tú cầu'];
  for (const key of keywords) {
    if (kwNorm.includes(normalizeVi(key))) {
      const found = flowers.find(
        (f) => normalizeVi(f.name).includes(normalizeVi(key)) || normalizeVi(f.customName || '').includes(normalizeVi(key)),
      );
      if (found) return found;
    }
  }

  return undefined;
}

interface RowResult {
  name: string;
  unit?: string;
  quantity: number;
}

/** Làm sạch một dòng OCR: bỏ ký tự bảng, gộp khoảng trắng, nối số bị tách dấu */
function prepareLine(raw: string): string {
  return raw
    .replace(/[|¦│┃[\]{}()<>]/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[“”"']/g, ' ')
    .replace(/(\d)\s+([.,])\s+(\d)/g, '$1$2$3')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bóc một dòng dạng bảng, chỉ lấy TÊN HÀNG + SỐ LƯỢNG.
 * Hỗ trợ: "1 thảo tím kg 4 38,000 152,000", "thảo tím 4 38,000 152,000",
 * "thảo tím | kg | 4 | 38,000 | 152,000", "thảo tím kg 4"
 */
function extractTableRow(line: string): RowResult | null {
  let s = line;
  // Bỏ số thứ tự đầu dòng: "1 ", "1.", "1)", "1-"
  s = s.replace(/^\s*\d{1,3}\s*[.)\-:]\s*(?=\D)/, '');
  s = s.replace(/^\s*\d{1,3}\s+(?=[^\d\s])/, '');
  s = s.replace(/^[.)\-:]+\s*/, '');

  const tokens = s.split(' ').filter(Boolean);
  if (tokens.length < 3) return null;

  // Tìm ĐVT (kg, bó, cành...) rồi lấy số đầu tiên sau ĐVT làm số lượng
  for (let i = tokens.length - 2; i >= 1; i--) {
    const unitInfo = unitTokenInfo(tokens[i]);
    if (!unitInfo) continue;

    const tail = tokens.slice(i + 1);
    if (!tail.every(isNumericToken)) continue;
    if (tail.length === 0) continue;

    const quantity = unitInfo.quantity ?? parseViNumber(tail[0]);
    if (!isValidQuantity(quantity)) continue;

    const name = cleanItemName(tokens.slice(0, i).join(' '));
    if (!isValidItemName(name)) continue;

    return { name, unit: unitInfo.unit, quantity };
  }

  // OCR bỏ sót cột SL nhưng còn ĐVT + đơn giá + thành tiền:
  // "hoàng anh kg 48,000 144,000" => SL = 144,000 / 48,000 = 3
  for (let i = tokens.length - 3; i >= 1; i--) {
    const unitInfo = unitTokenInfo(tokens[i]);
    if (!unitInfo) continue;

    const tail = tokens.slice(i + 1);
    if (tail.length !== 2 || !tail.every(isNumericToken)) continue;

    const quantity = deriveQuantityFromMoney(parseViNumber(tail[0]), parseViNumber(tail[1]));
    if (quantity === null) continue;

    const name = cleanItemName(tokens.slice(0, i).join(' '));
    if (!isValidItemName(name)) continue;

    return { name, unit: unitInfo.unit, quantity };
  }

  // Không tìm được ĐVT (bảng không có cột ĐVT hoặc OCR đọc sai): dựa vào cụm số cuối dòng
  // "thảo tím 4 38,000 152,000" => SL là số đầu tiên trong cụm số cuối
  let numericTail = 0;
  for (let i = tokens.length - 1; i >= 0 && isNumericToken(tokens[i]); i--) numericTail++;

  if (numericTail >= 3) {
    const qtyIndex = tokens.length - numericTail;
    const quantity = parseViNumber(tokens[qtyIndex]);
    const nextNumber = parseViNumber(tokens[qtyIndex + 1] || '');
    const nameTokens = tokens.slice(0, qtyIndex);
    const unitToken = nameTokens.find((t) => unitTokenInfo(t));
    const name = cleanItemName(nameTokens.join(' '));
    if (isValidQuantity(quantity) && nextNumber >= Math.max(100, quantity * 5) && isValidItemName(name)) {
      return { name, unit: unitToken ? unitTokenInfo(unitToken)?.unit : undefined, quantity };
    }
  }

  return null;
}

/**
 * Dự phòng khi OCR tách mỗi ô của bảng thành một dòng riêng:
 * "thảo tím" / "kg" / "4" / "38,000" / "152,000" => lấy tên + SL (4)
 */
function extractSplitTableRows(lines: string[]): RowResult[] {
  const rows: RowResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const unitInfo = unitTokenInfo(lines[i]);
    if (!unitInfo || lines[i].split(' ').length !== 1) continue;

    const quantity = unitInfo.quantity ?? parseViNumber(lines[i + 1] || '');
    if (!isValidQuantity(quantity)) continue;

    let nameIndex = i - 1;
    if (/^\d{1,3}$/.test(lines[nameIndex]) && nameIndex > 0) nameIndex--;
    const name = cleanItemName(lines[nameIndex]);
    if (!isValidItemName(name)) continue;

    rows.push({ name, unit: unitInfo.unit, quantity });
    i++;
  }

  return rows;
}

/** Dòng phiếu dạng chữ: "Hồng đỏ: 500 cành", "500 cành hồng đỏ", "Hồng đỏ: 500" */
function extractLooseRow(line: string): RowResult | null {
  if (isNonItemName(line)) return null;

  const s = line
    .replace(/^\s*\d{1,3}\s*[.)\-:]\s*(?=\D)/, '')
    .replace(/^\s*\d{1,3}\s+(?=[^\d\s])/, '')
    .trim();
  if (!s || s.length < 3) return null;

  const numbers = s.match(/\d[\d.,]*/g) || [];
  if (numbers.length > 2) return null;

  // "Tên hoa: 500 cành" / "Tên hoa - 500 kg"
  const endUnit = s.match(/^(.*?)[\s:\-–]+(\d[\d.,]*)\s*([A-Za-zÀ-ỹ]{1,8})\s*$/);
  if (endUnit) {
    const unit = unitTokenInfo(endUnit[3])?.unit;
    const name = cleanItemName(endUnit[1]);
    const quantity = parseViNumber(endUnit[2]);
    if (unit && isValidItemName(name) && isValidQuantity(quantity)) {
      return { name, unit, quantity };
    }
  }

  // "500 cành hoa hồng đỏ" / "500 hoa hồng đỏ"
  const startUnit = s.match(/^(\d[\d.,]*)\s*([A-Za-zÀ-ỹ]{1,8})?\s*[\s:\-–]+(.+)$/);
  if (startUnit) {
    const unit = startUnit[2] ? unitTokenInfo(startUnit[2])?.unit : undefined;
    const name = cleanItemName(startUnit[3]);
    const quantity = parseViNumber(startUnit[1]);
    if (isValidItemName(name) && isValidQuantity(quantity)) {
      return { name, unit, quantity };
    }
  }

  // "Hồng đỏ Đà Lạt: 1000"
  const endNumber = s.match(/^(.*?)[\s:\-–]+(\d[\d.,]*)\s*$/);
  if (endNumber) {
    const name = cleanItemName(endNumber[1]);
    const quantity = parseViNumber(endNumber[2]);
    if (isValidItemName(name) && isValidQuantity(quantity)) {
      return { name, quantity };
    }
  }

  return null;
}

function buildParsedItem(
  rawName: string,
  quantity: number,
  unit: string | undefined,
  flowers: Flower[],
  index: number,
  confidence: ParsedFlowerItem['confidence'],
): ParsedFlowerItem {
  const matched = findBestMatchingFlower(rawName, flowers);

  return {
    id: `parsed-${Date.now()}-${index}`,
    flowerName: matched ? matched.name : rawName,
    flowerCode: matched ? matched.code : `HOA-${String(100 + index)}`,
    customName: matched?.customName || rawName,
    matchedFlowerId: matched?.id,
    quantity,
    costPrice: matched?.costPrice || 0,
    unit: unit || matched?.unit || 'Cành',
    confidence,
    rawName,
  };
}

/** Cột của bảng tab (OCR.space isTable=true): Tên hàng | ĐVT | SL | Đơn giá | Thành toán */
interface TabColumnMap {
  name: number;
  unit?: number;
  qty: number;
}

function detectTabColumns(cells: string[]): TabColumnMap | null {
  const norm = cells.map((c) => normalizeVi(c));
  const find = (patterns: RegExp[]) => norm.findIndex((c) => c.length > 0 && patterns.some((p) => p.test(c)));

  const name = find([/^ten hang/, /^ten san pham/, /^ten mat hang/, /^mat hang/, /^quy cach/, /^ten$/]);
  const qty = find([/^sl$/, /^so luong/, /^sluong$/, /^soluong$/]);
  if (name === -1 || qty === -1) return null;

  const unit = find([/^dvt$/, /^dv$/, /^d\/v$/, /^don vi/, /^unit$/]);
  return { name, unit: unit === -1 ? undefined : unit, qty };
}

/** Ô có chứa số lượng? Hỗ trợ cả dạng dính ĐVT "4kg" */
function readNumericCell(cell: string): number | null {
  if (!/\d/.test(cell)) return null;
  const unitInfo = unitTokenInfo(cell);
  if (unitInfo?.quantity !== undefined) return unitInfo.quantity;
  const value = parseViNumber(cell);
  return Number.isFinite(value) ? value : null;
}

/**
 * Bóc một dòng bảng có phân cột bằng tab.
 * "thảo tím\tkg\t4\t38,000\t152,000" => { name: "thảo tím", unit: "kg", quantity: 4 }
 */
function extractTabbedRow(cells: string[], columns: TabColumnMap | null, headerLength: number): RowResult | null {
  if (cells.length < 3) return null;

  // Chỉ dùng bản đồ cột khi dòng có đúng số ô như header (tránh lệch cột khi OCR bỏ ô)
  const aligned = columns && headerLength > 0 && cells.length === headerLength ? columns : null;

  // 1) Tìm ô tên hàng
  let nameIndex = -1;
  let name = '';

  if (aligned) {
    const directName = cells[aligned.name] ? cleanItemName(cells[aligned.name]) : '';
    if (isValidItemName(directName)) {
      nameIndex = aligned.name;
      name = directName;
    }
  }

  if (nameIndex === -1) {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell || /^\d+$/.test(cell)) continue;
      if (unitTokenInfo(cell)) continue;
      const candidate = cleanItemName(cell);
      if (isValidItemName(candidate)) {
        nameIndex = i;
        name = candidate;
        break;
      }
    }
  }

  if (nameIndex === -1 || !isValidItemName(name)) return null;

  // 2) Số lượng: ưu tiên cột SL, nếu không có thì lấy số hợp lệ đầu tiên sau tên
  const numbers: Array<{ index: number; value: number }> = [];
  for (let i = nameIndex + 1; i < cells.length; i++) {
    const value = readNumericCell(cells[i]);
    if (value !== null) numbers.push({ index: i, value });
  }
  if (numbers.length === 0) return null;

  let chosen: { index: number; value: number } | undefined;

  if (aligned) {
    const targetValue = readNumericCell(cells[aligned.qty]);
    if (targetValue !== null && isValidQuantity(targetValue)) {
      chosen = { index: aligned.qty, value: targetValue };
    }
  }

  if (!chosen) {
    for (const candidate of numbers) {
      if (!isValidQuantity(candidate.value)) continue;
      const after = numbers.filter((n) => n.index > candidate.index);
      const hasPriceAfter = after.some((n) => n.value >= Math.max(100, candidate.value * 5));
      const hasUnitBefore = cells
        .slice(nameIndex + 1, candidate.index)
        .some((c) => !!unitTokenInfo(c));
      const isLast = after.length === 0;
      if (hasPriceAfter || hasUnitBefore || isLast) {
        chosen = candidate;
        break;
      }
    }
  }

  // OCR bỏ sót hẳn cột SL: chỉ còn đơn giá + thành tiền => SL = thành tiền / đơn giá
  if (!chosen) {
    const money = numbers.filter((n) => n.value >= 100);
    if (money.length >= 2) {
      const derived = deriveQuantityFromMoney(money[0].value, money[money.length - 1].value);
      if (derived !== null) chosen = { index: money[0].index, value: derived };
    }
  }

  if (!chosen || !isValidQuantity(chosen.value)) return null;

  // 3) ĐVT: ô giữa tên và số lượng (hoặc đúng cột ĐVT nếu căn được)
  let unit: string | undefined;
  if (aligned?.unit !== undefined) {
    const cell = cells[aligned.unit];
    if (cell) unit = unitTokenInfo(cell)?.unit;
  }
  if (!unit) {
    for (let i = nameIndex + 1; i < chosen.index; i++) {
      const info = unitTokenInfo(cells[i]);
      if (info) {
        unit = info.unit;
        break;
      }
    }
  }

  return { name, unit, quantity: chosen.value };
}

/**
 * Phân tích văn bản OCR của hóa đơn / phiếu nhà vườn.
 * Chỉ trích xuất TÊN HÀNG và SỐ LƯỢNG, các cột đơn giá/thành tiền được bỏ qua.
 */
export function parseFlowerTextToItems(text: string, flowers: Flower[]): ParsedFlowerItem[] {
  if (!text || !text.trim()) return [];

  const rawLines = text.split(/\r?\n/);
  const items: ParsedFlowerItem[] = [];
  const seen = new Set<string>();

  const pushRow = (row: RowResult | null, confidence: ParsedFlowerItem['confidence'] = 'high') => {
    if (!row || !isValidQuantity(row.quantity)) return;
    const key = `${normalizeVi(row.name)}|${row.quantity}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(buildParsedItem(row.name, row.quantity, row.unit, flowers, items.length, confidence));
  };

  // 1) Bảng có cột tab (OCR.space isTable=true): đọc theo đúng cột Tên hàng / ĐVT / SL
  let tabColumns: TabColumnMap | null = null;
  let tabHeaderLength = 0;

  for (const raw of rawLines) {
    if (!raw.includes('\t')) continue;
    const cells = raw.split('\t').map((c) => prepareLine(c));
    while (cells.length > 0 && !cells[cells.length - 1]) cells.pop();

    const header = detectTabColumns(cells);
    if (header) {
      tabColumns = header;
      tabHeaderLength = cells.length;
      continue;
    }

    pushRow(extractTabbedRow(cells, tabColumns, tabHeaderLength));
  }

  // 1b) Bảng Markdown (| cell | cell |) do Ocr4AI hoặc LLM sinh ra
  let mdColumns: TabColumnMap | null = null;
  let mdHeaderLength = 0;

  for (const raw of rawLines) {
    if (!raw.includes('|')) continue;
    // Bỏ dòng gạch phân cách bảng markdown (|---|---|)
    if (/^\s*\|?[\s\-:]+(\|[\s\-:]+)+\|?\s*$/.test(raw)) continue;

    const parts = raw.split('|').map((c) => c.trim());
    if (parts.length > 0 && parts[0] === '') parts.shift();
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
    if (parts.length < 2) continue;

    const cells = parts.map((c) => prepareLine(c));
    const header = detectTabColumns(cells);
    if (header) {
      mdColumns = header;
      mdHeaderLength = cells.length;
      continue;
    }

    if (mdColumns) {
      pushRow(extractTabbedRow(cells, mdColumns, mdHeaderLength));
    }
  }

  // 2) Các dòng còn lại (Tesseract / dán văn bản / dòng tự do): bóc theo khoảng trắng
  const lines = rawLines
    .filter((l) => !l.includes('\t') && !l.includes('|'))
    .map(prepareLine)
    .filter(Boolean);

  for (const line of lines) {
    pushRow(extractTableRow(line));
  }

  // OCR đôi khi tách mỗi ô của bảng thành một dòng riêng => ghép lại theo cột ĐVT
  if (items.length === 0) {
    for (const row of extractSplitTableRows(lines)) {
      pushRow(row);
    }
  }

  // Không phải bảng kê => đọc theo dạng phiếu chữ (Zalo, tin nhắn đặt hoa)
  if (items.length === 0) {
    for (const line of lines) {
      const row = extractLooseRow(line);
      if (!row || !isValidItemName(row.name) || !isValidQuantity(row.quantity)) continue;
      pushRow(row, 'medium');
    }
  }

  return items;
}

/**
 * Chuyển đổi danh sách hoa nhận diện được thành SupplierOrderItem cho đơn hàng NCC
 */
export function convertToSupplierOrderItems(parsedList: ParsedFlowerItem[]): SupplierOrderItem[] {
  return parsedList.map((item) => ({
    flowerId: item.matchedFlowerId || item.id,
    flowerCode: item.flowerCode,
    flowerName: item.flowerName,
    customName: item.customName,
    unit: item.unit,
    quantity: item.quantity,
    costPrice: item.costPrice,
    amount: item.quantity * item.costPrice,
  }));
}
