import { GOOGLE_SHEETS_CONFIG } from '@/config/googleSheetsConfig';
import {
  useCashStore,
  useDebtStore,
  useDistributorStore,
  useEmployeeStore,
  useFlowerStore,
  useInventoryStore,
  useOrderStore,
  useSupplierOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import { useOrderLogStore } from '@/stores/orderLogStore';
import type { Distributor, Flower, Supplier } from '@/types/hoaKhangThanh';

export interface SheetStatusInfo {
  id: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface GoogleSheetsStatus {
  connected: boolean;
  spreadsheetId: string;
  title: string;
  url: string;
  sheets: SheetStatusInfo[];
  error?: string;
}

export interface SyncResult {
  success: boolean;
  totalUpdatedCells?: number;
  updatedSheetsCount?: number;
  timestamp?: string;
  error?: string;
}

/**
 * Kiểm tra trạng thái kết nối tới Google Spreadsheet
 */
export async function checkGoogleSheetsConnection(): Promise<GoogleSheetsStatus> {
  try {
    const res = await fetch('/api/google-sheets/status');
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        connected: false,
        spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
        title: GOOGLE_SHEETS_CONFIG.title,
        url: GOOGLE_SHEETS_CONFIG.spreadsheetUrl,
        sheets: [],
        error: data.error ? JSON.stringify(data.error) : 'Không thể kết nối Google Sheets',
      };
    }
    return data;
  } catch (err: any) {
    return {
      connected: false,
      spreadsheetId: GOOGLE_SHEETS_CONFIG.spreadsheetId,
      title: GOOGLE_SHEETS_CONFIG.title,
      url: GOOGLE_SHEETS_CONFIG.spreadsheetUrl,
      sheets: [],
      error: err?.message || 'Lỗi mạng khi kiểm tra Google Sheets',
    };
  }
}

/**
 * Đẩy toàn bộ dữ liệu từ các store trên Web lên 11 sheets của Google Spreadsheet
 */
export async function syncAllToGoogleSheets(): Promise<SyncResult> {
  try {
    const orders = useOrderStore.getState().orders;
    const flowers = useFlowerStore.getState().flowers;
    const distributors = useDistributorStore.getState().distributors;
    const suppliers = useSupplierStore.getState().suppliers;
    const supplierOrders = useSupplierOrderStore.getState().orders;
    const debtRecords = useDebtStore.getState().records;
    const transactions = useCashStore.getState().transactions;
    const inventory = useInventoryStore.getState().inventory;
    const employees = useEmployeeStore.getState().employees;
    const auditLogs = useOrderLogStore.getState().logs;

    const payload = {
      orders,
      flowers,
      distributors,
      suppliers,
      supplierOrders,
      debtRecords,
      transactions,
      inventory,
      employees,
      auditLogs,
    };

    const res = await fetch('/api/google-sheets/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error ? JSON.stringify(result.error) : 'Không thể đồng bộ lên Google Sheets',
      };
    }

    return {
      success: true,
      totalUpdatedCells: result.totalUpdatedCells,
      updatedSheetsCount: result.updatedSheetsCount,
      timestamp: result.timestamp,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Lỗi mạng khi đồng bộ Google Sheets',
    };
  }
}

/**
 * Tải dữ liệu từ Google Sheets về cập nhật vào các Store trên web
 */
export async function pullFromGoogleSheets(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/google-sheets/pull-all');
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error ? JSON.stringify(result.error) : 'Lỗi khi tải từ Google Sheets');
    }

    const valueRanges: Array<{ range: string; values?: any[][] }> = result.valueRanges || [];

    let countFlowers = 0;
    let countDistributors = 0;
    let countSuppliers = 0;

    for (const vr of valueRanges) {
      const range = vr.range || '';
      const rows = vr.values || [];

      // DANH_SACH_HOA
      if (range.includes('DANH_SACH_HOA') && rows.length > 0) {
        const validRows = rows.filter((r) => r[0] && r[1]);
        if (validRows.length > 0) {
          const newFlowers: Flower[] = validRows.map((r, idx) => ({
            id: `hoa-sync-${idx + 1}`,
            code: String(r[0] || '').trim(),
            name: String(r[1] || '').trim(),
            customName: r[2] ? String(r[2]).trim() : undefined,
            unit: String(r[3] || 'cành').trim(),
            category: String(r[4] || 'Khác').trim(),
            costPrice: 0,
            wholesalePrice: 0,
            stock: 100,
            origin: 'Đà Lạt',
            color: 'Đa sắc',
            status: (r[5] === 'Tạm hết' ? 'out_of_stock' : 'active') as 'active' | 'out_of_stock',
            description: String(r[6] || '').trim(),
          }));
          useFlowerStore.setState({ flowers: newFlowers });
          countFlowers = newFlowers.length;
        }
      }

      // NHA_PHAN_PHOI
      if (range.includes('NHA_PHAN_PHOI') && rows.length > 0) {
        const validRows = rows.filter((r) => r[0] && r[1]);
        if (validRows.length > 0) {
          const newDistributors: Distributor[] = validRows.map((r, idx) => ({
            id: `npp-sync-${idx + 1}`,
            code: String(r[0] || '').trim(),
            name: String(r[1] || '').trim(),
            representative: String(r[2] || '').trim(),
            phone: String(r[3] || '').trim(),
            email: '',
            address: String(r[4] || '').trim(),
            region: String(r[5] || '').trim(),
            tier: 'VIP 1 (Kim Cương)',
            discount: 0,
            totalRevenue: Number(r[7]) || 0,
            currentDebt: Number(r[9]) || 0,
            oldDebt: Number(r[6]) || 0,
            status: 'active' as const,
          }));
          useDistributorStore.setState({ distributors: newDistributors });
          countDistributors = newDistributors.length;
        }
      }

      // NHA_CUNG_CAP
      if (range.includes('NHA_CUNG_CAP') && rows.length > 0) {
        const validRows = rows.filter((r) => r[0] && r[1]);
        if (validRows.length > 0) {
          const newSuppliers: Supplier[] = validRows.map((r, idx) => ({
            id: `ncc-sync-${idx + 1}`,
            code: String(r[0] || '').trim(),
            name: String(r[1] || '').trim(),
            contactPerson: String(r[2] || '').trim(),
            phone: String(r[3] || '').trim(),
            email: '',
            address: String(r[4] || '').trim(),
            specialties: [String(r[5] || 'Hoa tươi')],
            rating: 5,
            totalDebt: Number(r[9]) || 0,
            oldDebt: Number(r[6]) || 0,
            importAmount: Number(r[7]) || 0,
            paidAmount: Number(r[8]) || 0,
            status: 'active' as const,
          }));
          useSupplierStore.setState({ suppliers: newSuppliers });
          countSuppliers = newSuppliers.length;
        }
      }
    }

    return {
      success: true,
      message: `Đã nạp ${countFlowers} loại hoa, ${countDistributors} NPP, ${countSuppliers} NCC từ Google Sheets!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Lỗi khi tải từ Google Sheets',
    };
  }
}
