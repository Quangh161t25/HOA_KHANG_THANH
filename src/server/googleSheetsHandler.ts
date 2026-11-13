import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GOOGLE_SHEETS_CONFIG } from '../config/googleSheetsConfig.js';
import { buildSheetTables, type SheetSyncBody } from '../lib/sheetTables.js';

const { spreadsheetId, serviceAccount } = GOOGLE_SHEETS_CONFIG;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function getGoogleSheetsAccessToken(): Promise<string> {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!privateKey) throw new Error('Thiếu GOOGLE_PRIVATE_KEY trong Environment Variables của Vercel.');
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  signer.end();
  const signature = signer.sign(privateKey);
  const encodedSignature = signature
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signInput}.${encodedSignature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Google OAuth2 Error: ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = now + 3500;
  return cachedToken;
}


export async function googleSheetsHandler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (!req.url?.startsWith('/api/google-sheets')) {
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'API không tồn tại' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  req.url = req.url?.split('?')[0];

  const sendJson = (statusCode: number, payload: unknown) => {
    res.statusCode = statusCode;
    res.end(JSON.stringify(payload));
  };

  const readBody = async <T>(): Promise<T> => {
    if (req.body !== undefined) {
      return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T;
    }
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  try {
    // GET /api/google-sheets/status
    if (req.method === 'GET' && req.url === '/api/google-sheets/status') {
      const token = await getGoogleSheetsAccessToken();
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meta = (await metaRes.json()) as {
        properties?: { title: string };
        sheets?: Array<{
          properties: {
            sheetId: number;
            title: string;
            gridProperties?: { rowCount: number; columnCount: number };
          };
        }>;
      };

      if (!metaRes.ok) {
        return sendJson(500, { success: false, error: meta });
      }

      return sendJson(200, {
        success: true,
        connected: true,
        spreadsheetId,
        title: meta.properties?.title || 'HOA_KHANG_THANH',
        url: GOOGLE_SHEETS_CONFIG.spreadsheetUrl,
        sheets: (meta.sheets || []).map((s) => ({
          id: s.properties.sheetId,
          title: s.properties.title,
          rowCount: s.properties.gridProperties?.rowCount || 0,
          columnCount: s.properties.gridProperties?.columnCount || 0,
        })),
      });
    }

    // POST /api/google-sheets/sync-all
    if (req.method === 'POST' && req.url === '/api/google-sheets/sync-all') {
      const token = await getGoogleSheetsAccessToken();
      const body = await readBody<SheetSyncBody>();

      const batchData = buildSheetTables(body);

      // Replace each supplied table atomically, including trailing old rows.
      // Keep row 1 (headers) and formatting. Empty input clears all data rows.
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meta = await metaRes.json() as { sheets?: Array<{ properties: { sheetId: number; title: string; gridProperties: { rowCount: number; columnCount: number } } }> };
      if (!metaRes.ok) return sendJson(500, { success: false, error: meta });
      const requests: unknown[] = [];
      for (const table of batchData) {
        const title = table.range.split('!')[0];
        const sheet = meta.sheets?.find((s) => s.properties.title === title)?.properties;
        if (!sheet) throw new Error(`Không tìm thấy sheet ${title}`);
        const requiredRows = table.values.length + 1;
        if (requiredRows > sheet.gridProperties.rowCount) {
          requests.push({ appendDimension: { sheetId: sheet.sheetId, dimension: 'ROWS', length: requiredRows - sheet.gridProperties.rowCount } });
        }
        requests.push({ updateCells: {
          range: { sheetId: sheet.sheetId, startRowIndex: 1 },
          rows: table.values.map((row) => ({ values: row.map((value) => ({
            userEnteredValue: typeof value === 'number' ? { numberValue: value } : { stringValue: String(value ?? '') },
          })) })),
          fields: 'userEnteredValue',
        } });
      }
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
        },
      );
      const updateResult = await updateRes.json();
      if (!updateRes.ok) return sendJson(500, { success: false, error: updateResult });

      return sendJson(200, {
        success: true,
        totalUpdatedCells: batchData.reduce((sum, table) => sum + table.values.reduce((n, row) => n + row.length, 0), 0),
        updatedSheetsCount: batchData.length,
        timestamp: new Date().toISOString(),
      });
    }

    // GET /api/google-sheets/pull-all
    if (req.method === 'GET' && req.url === '/api/google-sheets/pull-all') {
      const token = await getGoogleSheetsAccessToken();
      const ranges = [
        'DANH_SACH_HOA!A2:G',
        'NHA_PHAN_PHOI!A2:N',
        'NHA_CUNG_CAP!A2:K',
        'DON_HANG!A2:S',
        'NHAN_VIEN!A2:L',
        'THU_CHI!A2:I',
        'TON_KHO!A2:I',
        'CHI_TIET_DON_HANG!A2:L',
        'DON_NHAP_NCC!A2:L',
        'CONG_NO!A2:I',
      ];

      const rangeParam = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
      const resData = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = (await resData.json()) as { valueRanges?: Array<{ range: string; values?: any[][] }> };
      if (!resData.ok) return sendJson(500, { success: false, error: result });
      return sendJson(200, { success: true, valueRanges: result.valueRanges || [] });
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, error: 'API không tồn tại' }));
    return;
  } catch (error: any) {
    console.error('[GoogleSheetsPlugin Error]:', error);
    return sendJson(500, {
      success: false,
      error: error?.message || String(error),
    });
  }
}
