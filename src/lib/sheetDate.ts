/**
 * Chuyển đổi ngày giữa app và Google Sheets.
 * - Trong app: lưu dạng chuẩn YYYY-MM-DD (dùng cho lọc, sắp xếp, ô chọn ngày).
 * - Trên Google Sheets: ghi dạng dd/mm/yyyy cho dễ đọc.
 * Giá trị không nhận dạng được thì giữ nguyên.
 */

const pad = (n: string | number) => String(n).padStart(2, '0');

/** Tách ngày thành [năm, tháng, ngày] từ YYYY-MM-DD, YYYY/MM/DD, ISO có giờ, hoặc d/m/yyyy */
function splitDate(value: unknown): [string, string, string] | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (m) return [m[1], pad(m[2]), pad(m[3])];

  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s.*)?$/);
  if (m) return [m[3], pad(m[2]), pad(m[1])];

  return null;
}

/** App → Sheets: "2026-11-08" → "08/11/2026" */
export function toSheetDate(value: unknown): string {
  const p = splitDate(value);
  if (!p) return value === undefined || value === null ? '' : String(value);
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** Sheets → App: "08/11/2026" → "2026-11-08" */
export function fromSheetDate(value: unknown): string {
  const p = splitDate(value);
  if (!p) return value === undefined || value === null ? '' : String(value).trim();
  return `${p[0]}-${p[1]}-${p[2]}`;
}

/** Thời điểm → "dd/mm/yyyy HH:mm:ss" theo giờ Việt Nam */
export function toSheetDateTime(value: Date | string | number = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
}
