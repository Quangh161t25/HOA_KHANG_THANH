import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { GOOGLE_SHEETS_CONFIG } from '../config/googleSheetsConfig.ts';

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
      const body = await readBody<{
        orders?: any[];
        flowers?: any[];
        distributors?: any[];
        suppliers?: any[];
        supplierOrders?: any[];
        transactions?: any[];
        debtRecords?: any[];
        inventory?: any[];
        employees?: any[];
        auditLogs?: any[];
      }>();

      const batchData: Array<{ range: string; values: any[][] }> = [];

      // 1. DON_HANG
      if (body.orders) {
        const rows = body.orders.map((o) => {
          const totalQty = (o.items || []).reduce((s: number, i: any) => s + (i.quantity || 0), 0);
          const subtotal = o.itemsSubtotal ?? (o.items || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
          const totalAmt = o.totalAmount ?? (subtotal + (o.shippingFee || 0) - (o.discount || 0));
          const debt = o.oldDebt ?? 0;
          const totalPay = o.totalPayment ?? (totalAmt + debt);
          const paid = o.paidAmount ?? 0;
          const remaining = totalPay - paid;

          return [
            o.code || '',
            o.orderDate || '',
            o.distributorName || '',
            o.phone || '',
            o.shippingAddress || '',
            totalQty,
            subtotal,
            o.shippingFee || 0,
            o.discount || 0,
            totalAmt,
            debt,
            totalPay,
            paid,
            remaining,
            o.status || '',
            o.paymentStatus || '',
            o.creator || '',
            o.notes || '',
            new Date().toLocaleString('vi-VN'),
          ];
        });

        // Clear old data from row 2 to 1000, then write new
        batchData.push({
          range: 'DON_HANG!A2:S' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']],
        });

        // 2. CHI_TIET_DON_HANG
        const detailRows: any[][] = [];
        body.orders.forEach((o) => {
          (o.items || []).forEach((item: any) => {
            detailRows.push([
              o.code || '',
              o.orderDate || '',
              o.distributorName || '',
              item.flowerCode || '',
              item.flowerName || '',
              item.quantity || 0,
              item.unit || 'cành',
              item.costPrice || 0,
              item.unitPrice || 0,
              item.importTotal || (item.quantity * (item.costPrice || 0)),
              item.amount || (item.quantity * (item.unitPrice || 0)),
              item.profit || ((item.amount || 0) - (item.importTotal || 0)),
            ]);
          });
        });

        batchData.push({
          range: 'CHI_TIET_DON_HANG!A2:L' + Math.max(2, detailRows.length + 1),
          values: detailRows.length > 0 ? detailRows : [['', '', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 3. DANH_SACH_HOA
      if (body.flowers) {
        const rows = body.flowers.map((f) => [
          f.code || '',
          f.name || '',
          Array.isArray(f.customNames) ? f.customNames.join(', ') : (f.customNames || ''),
          f.unit || 'cành',
          f.category || '',
          f.status || 'Đang bán',
          f.description || '',
        ]);
        batchData.push({
          range: 'DANH_SACH_HOA!A2:G' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '']],
        });
      }

      // 4. NHA_PHAN_PHOI
      if (body.distributors) {
        const rows = body.distributors.map((d) => [
          d.code || '',
          d.name || '',
          d.representative || '',
          d.phone || '',
          d.address || '',
          d.region || '',
          d.oldDebt || 0,
          d.totalRevenue || 0,
          d.collectedAmount || 0,
          d.currentDebt ?? ((d.oldDebt || 0) + (d.totalRevenue || 0) - (d.collectedAmount || 0)),
          d.lastOrderDate || '',
          d.daysSinceLastOrder ? `${d.daysSinceLastOrder} ngày` : '',
          d.isOverdue ? '⚠️ Quá hạn' : 'Bình thường',
          d.status || 'Hoạt động',
        ]);
        batchData.push({
          range: 'NHA_PHAN_PHOI!A2:N' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 5. NHA_CUNG_CAP
      if (body.suppliers) {
        const rows = body.suppliers.map((s) => [
          s.code || '',
          s.name || '',
          s.contactPerson || '',
          s.phone || '',
          s.address || '',
          s.specialties ? (Array.isArray(s.specialties) ? s.specialties.join(', ') : s.specialties) : '',
          s.oldDebt || 0,
          s.importAmount || 0,
          s.paidAmount || 0,
          s.totalDebt ?? ((s.oldDebt || 0) + (s.importAmount || 0) - (s.paidAmount || 0)),
          s.status || 'Đang giao dịch',
        ]);
        batchData.push({
          range: 'NHA_CUNG_CAP!A2:K' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 6. DON_NHAP_NCC
      if (body.supplierOrders) {
        const rows = body.supplierOrders.map((so) => [
          so.code || '',
          so.orderDate || '',
          so.supplierName || '',
          so.totalQuantity || (so.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
          so.totalAmount || 0,
          so.shippingFee || 0,
          so.finalAmount ?? ((so.totalAmount || 0) + (so.shippingFee || 0)),
          so.paidAmount || 0,
          (so.finalAmount || 0) - (so.paidAmount || 0),
          so.status || '',
          so.creator || '',
          so.notes || '',
        ]);
        batchData.push({
          range: 'DON_NHAP_NCC!A2:L' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 7. CONG_NO
      if (body.debtRecords) {
        const rows = body.debtRecords.map((r) => [
          r.date || '',
          r.partnerName || '',
          r.partnerType === 'npp' ? 'NPP' : 'NCC',
          r.type || r.entryType || '',
          r.amount || 0,
          r.remainingDebt || r.finalDebt || 0,
          r.referenceCode || '',
          r.creator || '',
          r.notes || '',
        ]);
        batchData.push({
          range: 'CONG_NO!A2:I' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '']],
        });
      }

      // 8. THU_CHI
      if (body.transactions) {
        const rows = body.transactions.map((t) => [
          t.code || '',
          t.date || '',
          t.type === 'income' ? 'Thu' : 'Chi',
          t.category || '',
          t.amount || 0,
          t.partner || '',
          t.paymentMethod || 'Tiền mặt',
          t.creator || '',
          t.notes || '',
        ]);
        batchData.push({
          range: 'THU_CHI!A2:I' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '']],
        });
      }

      // 9. TON_KHO
      if (body.inventory) {
        const rows = body.inventory.map((inv) => [
          inv.flowerCode || '',
          inv.flowerName || '',
          inv.unit || 'cành',
          inv.currentStock || 0,
          inv.minStock || 0,
          inv.maxStock || 0,
          inv.costPrice || 0,
          inv.status === 'out' ? '🚫 Hết hàng' : inv.status === 'low' ? '⚠️ Sắp hết' : inv.status === 'excess' ? '📦 Dư hàng' : 'Đủ hàng',
          inv.warehouse || 'Kho mát',
          inv.lastImportDate || '',
          inv.freshness || '',
        ]);
        batchData.push({
          range: 'TON_KHO!A2:K' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 10. NHAN_VIEN
      if (body.employees) {
        const rows = body.employees.map((e) => [
          e.code || '',
          e.fullName || '',
          e.username || '',
          e.position || '',
          e.department || '',
          e.role === 'admin' ? 'Quản trị viên' : 'Nhân viên',
          e.phone || '',
          e.email || '',
          e.joinDate || '',
          e.salary || 0,
          e.status || 'Đang làm việc',
        ]);
        batchData.push({
          range: 'NHAN_VIEN!A2:K' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '']],
        });
      }

      // 11. LICH_SU_THAO_TAC
      if (body.auditLogs) {
        const rows = body.auditLogs.map((l) => [
          l.id || '',
          l.timestamp ? new Date(l.timestamp).toLocaleString('vi-VN') : '',
          l.performerName || '',
          l.performerCode || '',
          l.performerRole || '',
          l.actionLabel || l.action || '',
          l.orderCode || '',
          l.distributorName || '',
          l.summary || '',
          l.details || '',
        ]);
        batchData.push({
          range: 'LICH_SU_THAO_TAC!A2:J' + Math.max(2, rows.length + 1),
          values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '']],
        });
      }

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
        'NHAN_VIEN!A2:K',
        'THU_CHI!A2:I',
        'TON_KHO!A2:I',
        'CHI_TIET_DON_HANG!A2:L',
        'DON_NHAP_NCC!A2:L',
        'CONG_NO!A2:I',
        'LICH_SU_THAO_TAC!A2:J',
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
