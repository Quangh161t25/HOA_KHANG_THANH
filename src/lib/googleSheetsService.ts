import { actionLabels, useModuleAuditStore } from '@/stores/moduleAuditStore';
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
import type {
  CashTransaction,
  DebtDailyRecord,
  Distributor,
  Employee,
  Flower,
  InventoryItem,
  Order,
  Supplier,
  SupplierOrder,
} from '@/types/hoaKhangThanh';

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
    const auditLogs = [
      ...useOrderLogStore.getState().logs,
      ...useModuleAuditStore.getState().logs.map((log) => ({
        id: log.id, timestamp: log.timestamp, performerName: log.performer,
        performerCode: log.performerCode, actionLabel: actionLabels[log.action],
        orderCode: log.record, distributorName: log.module,
        summary: `${actionLabels[log.action]}: ${log.record}`,
        details: log.changes.map((c) => `${c.field}: ${c.before} → ${c.after}`).join(' | '),
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

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
 * Tải toàn bộ dữ liệu từ Google Sheets về cập nhật vào tất cả Store trên web
 */
export async function pullFromGoogleSheets(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/google-sheets/pull-all');
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error ? JSON.stringify(result.error) : 'Lỗi khi tải từ Google Sheets');
    }

    const valueRanges: Array<{ range: string; values?: any[][] }> = result.valueRanges || [];

    // Build lookup: title → rows
    const sheetMap: Record<string, any[][]> = {};
    for (const vr of valueRanges) {
      const title = (vr.range || '').split('!')[0].replace(/'/g, '');
      sheetMap[title] = (vr.values || []).filter((r) => r.some((c) => c !== '' && c !== undefined));
    }

    const counts: Record<string, number> = {};

    // --- 1. DANH_SACH_HOA ---
    const flowerRows = sheetMap['DANH_SACH_HOA'] || [];
    if (flowerRows.length > 0) {
      const flowers: Flower[] = flowerRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
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
        status: (r[5] === 'Tạm hết' ? 'out_of_stock' : 'active') as Flower['status'],
        description: String(r[6] || '').trim(),
      }));
      useFlowerStore.setState({ flowers });
      counts['hoa'] = flowers.length;
    }

    // --- 2. NHA_PHAN_PHOI ---
    const nppRows = sheetMap['NHA_PHAN_PHOI'] || [];
    if (nppRows.length > 0) {
      const distributors: Distributor[] = nppRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
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
        oldDebt: Number(r[6]) || 0,
        totalRevenue: Number(r[7]) || 0,
        collectedAmount: Number(r[8]) || 0,
        currentDebt: Number(r[9]) || 0,
        status: 'active' as const,
      }));
      useDistributorStore.setState({ distributors });
      counts['npp'] = distributors.length;
    }

    // --- 3. NHA_CUNG_CAP ---
    const nccRows = sheetMap['NHA_CUNG_CAP'] || [];
    if (nccRows.length > 0) {
      const suppliers: Supplier[] = nccRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
        id: `ncc-sync-${idx + 1}`,
        code: String(r[0] || '').trim(),
        name: String(r[1] || '').trim(),
        contactPerson: String(r[2] || '').trim(),
        phone: String(r[3] || '').trim(),
        email: '',
        address: String(r[4] || '').trim(),
        specialties: r[5] ? String(r[5]).split(',').map((s: string) => s.trim()) : ['Hoa tươi'],
        rating: 5,
        oldDebt: Number(r[6]) || 0,
        importAmount: Number(r[7]) || 0,
        paidAmount: Number(r[8]) || 0,
        totalDebt: Number(r[9]) || 0,
        status: 'active' as const,
      }));
      useSupplierStore.setState({ suppliers });
      counts['ncc'] = suppliers.length;
    }

    // --- 4. NHAN_VIEN ---
    // Columns: code, fullName, username, position, department, role, phone, email, joinDate, salary, status
    const nvRows = sheetMap['NHAN_VIEN'] || [];
    if (nvRows.length > 0) {
      const existing = useEmployeeStore.getState().employees;
      const existingMap = new Map(existing.map((e) => [e.code, e]));
      const employees: Employee[] = nvRows.filter((r) => r[0] && r[1]).map((r, idx) => {
        const code = String(r[0] || '').trim();
        const prev = existingMap.get(code);
        return {
          id: prev?.id || `nv-sync-${idx + 1}`,
          code,
          fullName: String(r[1] || '').trim(),
          username: String(r[2] || '').trim() || prev?.username || '',
          position: String(r[3] || '').trim(),
          department: String(r[4] || '').trim(),
          role: (r[5] === 'Quản trị viên' ? 'admin' : 'member') as Employee['role'],
          phone: String(r[6] || '').trim(),
          email: String(r[7] || '').trim(),
          joinDate: String(r[8] || '').trim(),
          salary: Number(r[9]) || 0,
          status: 'active' as Employee['status'],
          password: prev?.password,
        };
      });
      useEmployeeStore.setState({ employees });
      counts['nhan_vien'] = employees.length;
    }

    // --- 5. TON_KHO ---
    // Columns: flowerCode, flowerName, unit, currentStock, minStock, maxStock, costPrice, warning, warehouse, lastImportDate, freshness
    const tonKhoRows = sheetMap['TON_KHO'] || [];
    if (tonKhoRows.length > 0) {
      const inventory: InventoryItem[] = tonKhoRows.filter((r) => r[0] && r[1]).map((r) => {
        const currentStock = Number(r[3]) || 0;
        const minStock = Number(r[4]) || 0;
        const maxStock = Number(r[5]) || 0;
        const status: InventoryItem['status'] =
          currentStock === 0 ? 'out' : currentStock <= minStock ? 'low' : currentStock > maxStock ? 'excess' : 'normal';
        return {
          flowerId: `inv-${String(r[0] || '').trim()}`,
          flowerCode: String(r[0] || '').trim(),
          flowerName: String(r[1] || '').trim(),
          category: 'Hoa tươi',
          unit: String(r[2] || 'cành').trim(),
          warehouse: String(r[8] || 'Kho mát').trim(),
          currentStock,
          minStock,
          maxStock,
          costPrice: Number(r[6]) || 0,
          lastImportDate: String(r[9] || '').trim(),
          shelfLifeDays: 7,
          freshness: String(r[10] || '').trim(),
          status,
        };
      });
      useInventoryStore.setState({ inventory });
      counts['ton_kho'] = inventory.length;
    }

    // --- 6. THU_CHI ---
    // Columns: code, date, type(Thu/Chi), category, amount, partner, paymentMethod, creator, notes
    const thuChiRows = sheetMap['THU_CHI'] || [];
    if (thuChiRows.length > 0) {
      const transactions: CashTransaction[] = thuChiRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
        id: `tc-sync-${idx + 1}`,
        code: String(r[0] || '').trim(),
        date: String(r[1] || '').trim(),
        type: (r[2] === 'Thu' ? 'income' : 'expense') as CashTransaction['type'],
        category: String(r[3] || '').trim(),
        amount: Number(r[4]) || 0,
        partner: String(r[5] || '').trim(),
        paymentMethod: (String(r[6] || 'Tiền mặt').trim()) as CashTransaction['paymentMethod'],
        creator: String(r[7] || '').trim(),
        notes: String(r[8] || '').trim(),
      }));
      useCashStore.setState({ transactions });
      counts['thu_chi'] = transactions.length;
    }

    // --- 7. CONG_NO ---
    // Columns: date, partnerName, partnerType(NPP/NCC), type, amount, remainingDebt, referenceCode, creator, notes
    const congNoRows = sheetMap['CONG_NO'] || [];
    if (congNoRows.length > 0) {
      const records: DebtDailyRecord[] = congNoRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
        id: `cn-sync-${idx + 1}`,
        date: String(r[0] || '').trim(),
        partnerType: (r[2] === 'NPP' ? 'npp' : 'ncc') as DebtDailyRecord['partnerType'],
        partnerId: `partner-sync-${idx + 1}`,
        partnerCode: '',
        partnerName: String(r[1] || '').trim(),
        type: (r[3] === 'thu' || r[3] === 'Thu' ? 'thu' : 'chi') as DebtDailyRecord['type'],
        amount: Number(r[4]) || 0,
        remainingDebt: Number(r[5]) || 0,
        finalDebt: Number(r[5]) || 0,
        referenceCode: String(r[6] || '').trim(),
        creator: String(r[7] || '').trim(),
        notes: String(r[8] || '').trim(),
      }));
      useDebtStore.setState({ records });
      counts['cong_no'] = records.length;
    }

    // --- 8. DON_HANG (tái tạo từ header, không có items) ---
    // Columns: code, orderDate, distributorName, phone, shippingAddress, totalQty,
    //          subtotal, shippingFee, discount, totalAmount, oldDebt, totalPayment, paidAmount, remaining, status, paymentStatus, creator, notes
    const donHangRows = sheetMap['DON_HANG'] || [];
    // Chỉ pull nếu local không có đơn hàng nào (tránh ghi đè đơn đang có items)
    const localOrders = useOrderStore.getState().orders;
    if (donHangRows.length > 0 && localOrders.length === 0) {
      const orders: Order[] = donHangRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
        id: `dh-sync-${idx + 1}`,
        code: String(r[0] || '').trim(),
        orderDate: String(r[1] || '').trim(),
        distributorName: String(r[2] || '').trim(),
        phone: String(r[3] || '').trim(),
        address: String(r[4] || '').trim(),
        totalQuantity: Number(r[5]) || 0,
        itemsSubtotal: Number(r[6]) || 0,
        shippingFee: Number(r[7]) || 0,
        discount: Number(r[8]) || 0,
        totalAmount: Number(r[9]) || 0,
        oldDebt: Number(r[10]) || 0,
        totalPayment: Number(r[11]) || 0,
        paidAmount: Number(r[12]) || 0,
        debtAmount: Number(r[13]) || 0,
        status: (String(r[14] || 'nhap').trim()) as Order['status'],
        paymentStatus: (String(r[15] || 'unpaid').trim()) as Order['paymentStatus'],
        creator: String(r[16] || '').trim(),
        notes: String(r[17] || '').trim(),
        items: [],
      }));
      useOrderStore.setState({ orders });
      counts['don_hang'] = orders.length;
    }

    // --- 9. DON_NHAP_NCC ---
    // Columns: code, orderDate, supplierName, totalQuantity, totalAmount, shippingFee, finalAmount, paidAmount, remaining, status, creator, notes
    const donNhapRows = sheetMap['DON_NHAP_NCC'] || [];
    const localSupplierOrders = useSupplierOrderStore.getState().orders;
    if (donNhapRows.length > 0 && localSupplierOrders.length === 0) {
      const supplierOrders: SupplierOrder[] = donNhapRows.filter((r) => r[0] && r[1]).map((r, idx) => ({
        id: `po-sync-${idx + 1}`,
        code: String(r[0] || '').trim(),
        orderDate: String(r[1] || '').trim(),
        supplierName: String(r[2] || '').trim(),
        totalQuantity: Number(r[3]) || 0,
        itemsSubtotal: Number(r[4]) || 0,
        shippingFee: Number(r[5]) || 0,
        discount: 0,
        totalAmount: Number(r[6]) || 0,
        paidAmount: Number(r[7]) || 0,
        debtAmount: Number(r[8]) || 0,
        status: (String(r[9] || 'nhap').trim()) as SupplierOrder['status'],
        paymentStatus: 'unpaid' as SupplierOrder['paymentStatus'],
        creator: String(r[10] || '').trim(),
        notes: String(r[11] || '').trim(),
        items: [],
      }));
      useSupplierOrderStore.setState({ orders: supplierOrders });
      counts['don_nhap_ncc'] = supplierOrders.length;
    }

    const parts = [
      counts['hoa'] ? `${counts['hoa']} loại hoa` : '',
      counts['npp'] ? `${counts['npp']} NPP` : '',
      counts['ncc'] ? `${counts['ncc']} NCC` : '',
      counts['nhan_vien'] ? `${counts['nhan_vien']} nhân viên` : '',
      counts['ton_kho'] ? `${counts['ton_kho']} mặt hàng tồn kho` : '',
      counts['thu_chi'] ? `${counts['thu_chi']} thu chi` : '',
      counts['cong_no'] ? `${counts['cong_no']} công nợ` : '',
      counts['don_hang'] ? `${counts['don_hang']} đơn hàng` : '',
      counts['don_nhap_ncc'] ? `${counts['don_nhap_ncc']} đơn nhập NCC` : '',
    ].filter(Boolean);

    return {
      success: true,
      message: parts.length > 0
        ? `Đã tải từ GG Sheets: ${parts.join(', ')}`
        : 'Kết nối thành công nhưng GG Sheets chưa có dữ liệu',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Lỗi khi tải từ Google Sheets',
    };
  }
}
