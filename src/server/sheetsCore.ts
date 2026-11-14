/**
 * Lõi đọc/ghi Google Sheets bằng service account (private key trong biến môi trường).
 * Không phụ thuộc Node: dùng Web Crypto + fetch nên chạy được trên
 *  - Vite dev / Vercel (Node, qua googleSheetsHandler.ts)
 *  - Cloudflare Pages Functions (functions/api/google-sheets/[[path]].ts)
 */
import { buildSheetTables, type SheetSyncBody } from '../lib/sheetTables.js';

export interface SheetsEnv {
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_CLIENT_EMAIL?: string;
  VITE_GOOGLE_SPREADSHEET_ID?: string;
  VITE_GOOGLE_SPREADSHEET_URL?: string;
  VITE_GOOGLE_SPREADSHEET_TITLE?: string;
  [key: string]: unknown;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  clientEmail: string;
  privateKey: string;
}

const DEFAULT_SPREADSHEET_ID = '1iFYENcKF-9y5y_cfsmSjZyfbITMl1aIYwYgPL6i9vnQ';
const DEFAULT_CLIENT_EMAIL = 'ca-nhan@h161-508101.iam.gserviceaccount.com';

export function resolveSheetsConfig(env: SheetsEnv): SheetsConfig {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const spreadsheetId = str(env.VITE_GOOGLE_SPREADSHEET_ID) || DEFAULT_SPREADSHEET_ID;
  return {
    spreadsheetId,
    spreadsheetUrl:
      str(env.VITE_GOOGLE_SPREADSHEET_URL) || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=0#gid=0`,
    title: str(env.VITE_GOOGLE_SPREADSHEET_TITLE) || 'HOA_KHANG_THANH',
    clientEmail: str(env.GOOGLE_CLIENT_EMAIL) || DEFAULT_CLIENT_EMAIL,
    // Biến môi trường thường lưu xuống dòng dạng "\n"; bỏ cả dấu ngoặc kép bao ngoài nếu có
    privateKey: str(env.GOOGLE_PRIVATE_KEY).replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
  };
}

// ---------- Token Google (JWT RS256 ký bằng Web Crypto) ----------

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

function base64UrlFromBytes(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const base64UrlFromString = (s: string) => base64UrlFromBytes(new TextEncoder().encode(s));

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function getAccessToken(cfg: SheetsConfig): Promise<string> {
  if (!cfg.privateKey) throw new Error('Thiếu GOOGLE_PRIVATE_KEY trong biến môi trường.');
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(cfg.clientEmail);
  if (cached && now < cached.expiresAt - 60) return cached.token;

  const header = base64UrlFromString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64UrlFromString(
    JSON.stringify({
      iss: cfg.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const signInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(cfg.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signInput));
  const jwt = `${signInput}.${base64UrlFromBytes(new Uint8Array(sig))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = (await res.json()) as { access_token?: string };
  if (!res.ok || !data.access_token) throw new Error(`Google OAuth2 Error: ${JSON.stringify(data)}`);

  tokenCache.set(cfg.clientEmail, { token: data.access_token, expiresAt: now + 3500 });
  return data.access_token;
}

// ---------- Xử lý 3 API ----------

const PULL_RANGES = [
  'DANH_SACH_HOA!A2:G',
  'NHA_PHAN_PHOI!A2:N',
  'NHA_CUNG_CAP!A2:K',
  'DON_HANG!A2:S',
  'NHAN_VIEN!A2:L',
  'THU_CHI!A2:I',
  'TON_KHO!A2:I',
  'CHI_TIET_DON_HANG!A2:L',
  'DON_NHAP_NCC!A2:L',
  'CONG_NO_NPP!A2:J',
  'CONG_NO_NCC!A2:J',
  'CONG_NO!A2:J',
];

export interface ApiResult {
  status: number;
  body: unknown;
}

/**
 * GET  /api/google-sheets/status
 * POST /api/google-sheets/sync-all
 * GET  /api/google-sheets/pull-all
 */
export async function handleSheetsApi(
  method: string,
  pathname: string,
  readJson: () => Promise<unknown>,
  cfg: SheetsConfig,
): Promise<ApiResult> {
  const path = pathname.replace(/\/+$/, '');
  const api = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}`;

  try {
    if (method === 'GET' && path === '/api/google-sheets/status') {
      const token = await getAccessToken(cfg);
      const metaRes = await fetch(api, { headers: { Authorization: `Bearer ${token}` } });
      const meta = (await metaRes.json()) as {
        properties?: { title: string };
        sheets?: Array<{ properties: { sheetId: number; title: string; gridProperties?: { rowCount: number; columnCount: number } } }>;
      };
      if (!metaRes.ok) return { status: 500, body: { success: false, error: meta } };
      return {
        status: 200,
        body: {
          success: true,
          connected: true,
          spreadsheetId: cfg.spreadsheetId,
          title: meta.properties?.title || cfg.title,
          url: cfg.spreadsheetUrl,
          sheets: (meta.sheets || []).map((s) => ({
            id: s.properties.sheetId,
            title: s.properties.title,
            rowCount: s.properties.gridProperties?.rowCount || 0,
            columnCount: s.properties.gridProperties?.columnCount || 0,
          })),
        },
      };
    }

    if (method === 'POST' && path === '/api/google-sheets/sync-all') {
      const token = await getAccessToken(cfg);
      const batchData = buildSheetTables(((await readJson()) || {}) as SheetSyncBody);

      // Ghi đè từng bảng từ dòng 2, giữ dòng tiêu đề và định dạng
      const metaRes = await fetch(`${api}?fields=sheets.properties`, { headers: { Authorization: `Bearer ${token}` } });
      const meta = (await metaRes.json()) as {
        sheets?: Array<{ properties: { sheetId: number; title: string; gridProperties: { rowCount: number; columnCount: number } } }>;
      };
      if (!metaRes.ok) return { status: 500, body: { success: false, error: meta } };

      const requests: unknown[] = [];
      for (const table of batchData) {
        const title = table.range.split('!')[0];
        let sheet = meta.sheets?.find((s) => s.properties.title === title)?.properties;
        if (!sheet) {
          // Tự tạo sheet mới nếu chưa có trên Spreadsheet
          const addRes = await fetch(`${api}:batchUpdate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: {
                      title,
                      gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 },
                    },
                  },
                },
              ],
            }),
          });
          const addData = (await addRes.json()) as { replies?: Array<{ addSheet?: { properties: any } }> };
          if (addData.replies?.[0]?.addSheet?.properties) {
            sheet = addData.replies[0].addSheet.properties;
            meta.sheets = meta.sheets || [];
            meta.sheets.push({ properties: sheet as any });
          } else {
            throw new Error(`Không tìm thấy và không thể tạo sheet ${title}`);
          }
        }
        if (!sheet) throw new Error(`Không tìm thấy sheet ${title}`);
        const requiredRows = table.values.length + 1;
        if (requiredRows > sheet.gridProperties.rowCount) {
          requests.push({
            appendDimension: { sheetId: sheet.sheetId, dimension: 'ROWS', length: requiredRows - sheet.gridProperties.rowCount },
          });
        }
        // Xóa các dòng cũ thừa ở cuối (khi dữ liệu mới ít dòng hơn), chỉ trong các cột của bảng.
        // Bỏ qua nếu bảng rỗng để tránh xóa trắng sheet khi app chưa có dữ liệu.
        const width = table.values.reduce((m, row) => Math.max(m, row.length), 0);
        const hasData = table.values.some((row) => row.some((v) => v !== '' && v !== null && v !== undefined));
        if (hasData && width > 0 && sheet.gridProperties.rowCount > requiredRows) {
          requests.push({
            updateCells: {
              range: { sheetId: sheet.sheetId, startRowIndex: requiredRows, startColumnIndex: 0, endColumnIndex: width },
              fields: 'userEnteredValue',
            },
          });
        }
        requests.push({
          updateCells: {
            range: { sheetId: sheet.sheetId, startRowIndex: 1 },
            rows: table.values.map((row) => ({
              values: row.map((value) => ({
                userEnteredValue: typeof value === 'number' ? { numberValue: value } : { stringValue: String(value ?? '') },
              })),
            })),
            fields: 'userEnteredValue',
          },
        });
      }

      const updateRes = await fetch(`${api}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      });
      const updateResult = await updateRes.json();
      if (!updateRes.ok) return { status: 500, body: { success: false, error: updateResult } };

      return {
        status: 200,
        body: {
          success: true,
          totalUpdatedCells: batchData.reduce((sum, t) => sum + t.values.reduce((n, row) => n + row.length, 0), 0),
          updatedSheetsCount: batchData.length,
          timestamp: new Date().toISOString(),
        },
      };
    }

    if (method === 'GET' && path === '/api/google-sheets/pull-all') {
      const token = await getAccessToken(cfg);
      const metaRes = await fetch(`${api}?fields=sheets.properties.title`, { headers: { Authorization: `Bearer ${token}` } });
      const meta = (await metaRes.json()) as {
        sheets?: Array<{ properties: { title: string } }>;
      };
      const existingTitles = new Set((meta.sheets || []).map((s) => s.properties.title));
      const validRanges = PULL_RANGES.filter((r) => existingTitles.has(r.split('!')[0]));
      const rangeParam = validRanges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
      const resData = await fetch(`${api}/values:batchGet?${rangeParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = (await resData.json()) as { valueRanges?: Array<{ range: string; values?: unknown[][] }> };
      if (!resData.ok) return { status: 500, body: { success: false, error: result } };
      return { status: 200, body: { success: true, valueRanges: result.valueRanges || [] } };
    }

    return { status: 404, body: { success: false, error: 'API không tồn tại' } };
  } catch (error) {
    console.error('[GoogleSheets Error]:', error);
    return { status: 500, body: { success: false, error: error instanceof Error ? error.message : String(error) } };
  }
}
