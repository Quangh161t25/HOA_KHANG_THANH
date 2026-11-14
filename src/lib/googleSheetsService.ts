import { pauseModuleAudit } from '@/stores/moduleAuditStore';
import { GOOGLE_SHEETS_CONFIG } from '@/config/googleSheetsConfig';
import { fromSheetDate } from '@/lib/sheetDate';
import {
  useCashStore,
  useDebtStore,
  useDistributorStore,
  useEmployeeStore,
  useFlowerStore,
  useInventoryStore,
  normalizeOrders,
  useOrderStore,
  useSupplierOrderStore,
  useSupplierStore,
  syncAllOrdersToDebtRecords,
  recalcAllDistributorsDebts,
  recalcAllSuppliersDebts,
} from '@/stores/hoaKhangThanhStore';
import type {
  CashTransaction,
  DebtDailyRecord,
  Distributor,
  Employee,
  Flower,
  InventoryItem,
  Order,
  OrderItem,
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
 * Chuyển đổi an toàn giá trị số từ ô Google Sheets thành số nguyên / thực
 * Hỗ trợ các định dạng tiền Việt Nam (VD: "11.450.000", "15,570,000", "4.740.000 đ", " 15.000.000 ")
 * Tránh lỗi Number("11.450.000") trả về NaN dẫn tới công nợ cũ bị hiển thị 0
 */
export function parseSheetNumber(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  let cleaned = str.replace(/\s+/g, '').replace(/[₫đVNDvnd$]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes('.') && !cleaned.includes(',')) {
    if ((cleaned.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    if ((cleaned.match(/,/g) || []).length > 1 || /,\d{3}$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
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

    // Lịch sử thao tác CHỈ lưu trên web, không ghi lên Google Sheets (sheet LICH_SU_THAO_TAC không còn được cập nhật).
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
  let resumeAudit: (() => void) | undefined;
  try {
    const res = await fetch('/api/google-sheets/pull-all');
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error ? JSON.stringify(result.error) : 'Lỗi khi tải từ Google Sheets');
    }

    resumeAudit = pauseModuleAudit();

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
      const existingFlowers = useFlowerStore.getState().flowers;
      const existingFlowerMap = new Map(existingFlowers.map((f) => [f.code, f]));
      const existingFlowerNameMap = new Map(existingFlowers.map((f) => [f.name, f]));

      const flowers: Flower[] = flowerRows.filter((r) => r[0] && r[1]).map((r, idx) => {
        const code = String(r[0] || '').trim();
        const name = String(r[1] || '').trim();
        const prev = existingFlowerMap.get(code) || existingFlowerNameMap.get(name);

        const cleanOrigin = (prev?.origin === 'Đà Lạt' || !prev?.origin) ? '' : prev.origin;
        const cleanColor = (prev?.color === 'Đa sắc' || !prev?.color) ? '' : prev.color;
        const cleanStock = (prev?.stock === 100 || prev?.stock === 200 || !prev?.stock) ? 0 : prev.stock;
        const cleanCategory = r[4] ? String(r[4]).trim() : (prev?.category === 'Khác' ? '' : (prev?.category || ''));
        const cleanUnit = r[3] ? String(r[3]).trim() : (prev?.unit || '');

        return {
          id: prev?.id || `hoa-sync-${idx + 1}`,
          code,
          name,
          customName: r[2] ? String(r[2]).trim() : (prev?.customName || ''),
          unit: cleanUnit,
          category: cleanCategory,
          costPrice: prev?.costPrice || 0,
          wholesalePrice: prev?.wholesalePrice || 0,
          stock: cleanStock,
          origin: cleanOrigin,
          color: cleanColor,
          status: (r[5] === 'Tạm hết' ? 'out_of_stock' : (r[5] ? 'active' : (prev?.status || 'active'))) as Flower['status'],
          description: String(r[6] || prev?.description || '').trim(),
        };
      });
      useFlowerStore.setState({ flowers });
      counts['hoa'] = flowers.length;
    }

    // --- 2. NHA_PHAN_PHOI ---
    const nppRows = sheetMap['NHA_PHAN_PHOI'] || [];
    if (nppRows.length > 0) {
      const existingNpp = useDistributorStore.getState().distributors;
      const existingNppMap = new Map(existingNpp.map((d) => [d.code, d]));
      const existingNppNameMap = new Map(existingNpp.map((d) => [d.name, d]));

      const distributors: Distributor[] = nppRows.filter((r) => r[0] && r[1]).map((r, idx) => {
        const code = String(r[0] || '').trim();
        const name = String(r[1] || '').trim();
        const prev = existingNppMap.get(code) || existingNppNameMap.get(name);
        const oldDebt = parseSheetNumber(r[6]);
        const totalRevenue = parseSheetNumber(r[7]);
        const collectedAmount = parseSheetNumber(r[8]);
        const currentDebt = parseSheetNumber(r[9]) || (oldDebt + totalRevenue - collectedAmount);

        return {
          id: prev?.id || `npp-sync-${idx + 1}`,
          code,
          name,
          representative: String(r[2] || '').trim() || prev?.representative || '',
          phone: String(r[3] || '').trim() || prev?.phone || '',
          email: prev?.email || '',
          address: String(r[4] || '').trim() || prev?.address || '',
          region: String(r[5] || '').trim() || prev?.region || 'Miền Nam',
          tier: prev?.tier || 'VIP 1 (Kim Cương)',
          discount: prev?.discount || 0,
          oldDebt,
          totalRevenue,
          salesAmount: totalRevenue,
          collectedAmount,
          currentDebt,
          finalDebt: currentDebt,
          status: 'active' as const,
        };
      });
      useDistributorStore.setState({ distributors });
      counts['npp'] = distributors.length;
    }

    // --- 3. NHA_CUNG_CAP ---
    const nccRows = sheetMap['NHA_CUNG_CAP'] || [];
    if (nccRows.length > 0) {
      const existingNcc = useSupplierStore.getState().suppliers;
      const existingNccMap = new Map(existingNcc.map((s) => [s.code, s]));
      const existingNccNameMap = new Map(existingNcc.map((s) => [s.name, s]));

      const suppliers: Supplier[] = nccRows.filter((r) => r[0] && r[1]).map((r, idx) => {
        const code = String(r[0] || '').trim();
        const name = String(r[1] || '').trim();
        const prev = existingNccMap.get(code) || existingNccNameMap.get(name);
        const oldDebt = parseSheetNumber(r[6]);
        const importAmount = parseSheetNumber(r[7]);
        const paidAmount = parseSheetNumber(r[8]);
        const totalDebt = parseSheetNumber(r[9]) || (oldDebt + importAmount - paidAmount);

        return {
          id: prev?.id || `ncc-sync-${idx + 1}`,
          code,
          name,
          contactPerson: String(r[2] || '').trim() || prev?.contactPerson || '',
          phone: String(r[3] || '').trim() || prev?.phone || '',
          email: prev?.email || '',
          address: String(r[4] || '').trim() || prev?.address || '',
          specialties: r[5] ? String(r[5]).split(',').map((s) => s.trim()) : prev?.specialties || ['Hoa tươi'],
          rating: parseSheetNumber(r[10]) || prev?.rating || 5,
          oldDebt,
          importAmount,
          paidAmount,
          totalDebt,
          finalDebt: totalDebt,
          status: 'active' as const,
        };
      });
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
          username: String(r[2] || '').trim() || prev?.username || code.toLowerCase().replace('-', ''),
          position: String(r[3] || '').trim(),
          department: String(r[4] || '').trim(),
          role: (r[5] === 'Quản trị viên' ? 'admin' : 'member') as Employee['role'],
          phone: String(r[6] || '').trim(),
          email: String(r[7] || '').trim(),
          joinDate: fromSheetDate(r[8]),
          salary: parseSheetNumber(r[9]) || 0,
          status: 'active' as Employee['status'],
          password: (r[11] ? String(r[11]).trim() : undefined) || prev?.password || '123456',
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
        const currentStock = parseSheetNumber(r[3]) || 0;
        const minStock = parseSheetNumber(r[4]) || 0;
        const maxStock = parseSheetNumber(r[5]) || 0;
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
          costPrice: parseSheetNumber(r[6]) || 0,
          lastImportDate: fromSheetDate(r[9]),
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
        date: fromSheetDate(r[1]),
        type: (r[2] === 'Thu' ? 'income' : 'expense') as CashTransaction['type'],
        category: String(r[3] || '').trim(),
        amount: parseSheetNumber(r[4]) || 0,
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
      const allDistributors = useDistributorStore.getState().distributors;
      const allSuppliers = useSupplierStore.getState().suppliers;
      // Bỏ dòng tiêu đề bị lẫn vào dữ liệu ("ngay | khach_hang").
      // Dòng công nợ của đơn hàng (có mã đơn) sẽ được syncAllOrdersToDebtRecords bỏ ra vì là cột ảo.
      const records: DebtDailyRecord[] = congNoRows
        .filter((r) => r[0] && r[1] && !(String(r[0]).trim().toLowerCase() === 'ngay' && String(r[1]).trim().toLowerCase() === 'khach_hang'))
        .map((r, idx) => {
        const partnerName = String(r[1] || '').trim();
        const isNpp = r[2] === 'NPP';
        const partnerType = (isNpp ? 'npp' : 'ncc') as DebtDailyRecord['partnerType'];
        const matchedDist = isNpp
          ? allDistributors.find((d) => d.name?.trim().toLowerCase() === partnerName.toLowerCase() || d.code === partnerName)
          : null;
        const matchedSup = !isNpp
          ? allSuppliers.find((s) => s.name?.trim().toLowerCase() === partnerName.toLowerCase() || s.code === partnerName)
          : null;

        const type = (r[3] === 'thu' || r[3] === 'Thu' ? 'thu' : 'chi') as DebtDailyRecord['type'];
        const amount = parseSheetNumber(r[4]) || 0;
        const isThu = type === 'thu';
        const rawRef = String(r[6] || '').trim();
        const isOrderRef = rawRef.startsWith('DH-') || rawRef.startsWith('PO-');

        return {
          id: `cn-sync-${idx + 1}`,
          date: fromSheetDate(r[0]),
          partnerType,
          partnerId: matchedDist?.id || matchedSup?.id || `partner-sync-${idx + 1}`,
          partnerCode: matchedDist?.code || matchedSup?.code || '',
          partnerName,
          type,
          amount,
          remainingDebt: parseSheetNumber(r[5]) || 0,
          finalDebt: parseSheetNumber(r[5]) || 0,
          increaseAmount: isThu ? 0 : amount,
          decreaseAmount: isThu ? amount : 0,
          referenceCode: rawRef,
          entryType: isOrderRef ? 'order' : 'daily',
          creator: String(r[7] || '').trim(),
          notes: String(r[8] || '').trim(),
        };
      });
      useDebtStore.setState({ records });
      counts['cong_no'] = records.length;
    }

    // --- 8. DON_HANG + CHI_TIET_DON_HANG ---
    // Chi tiết hoa được lưu ở sheet riêng. Phải ghép lại theo mã đơn khi tải về;
    // nếu không, việc đăng nhập/đồng bộ xuống sẽ thay toàn bộ items bằng mảng rỗng.
    // Giữ nguyên thứ tự dòng của Google Sheets (hàng cũ ở trên, hàng mới thêm ở dưới cùng)
    const donHangRows = sheetMap['DON_HANG'] || [];
    if (donHangRows.length > 0) {
      const existingOrders = useOrderStore.getState().orders;
      const existingOrderMap = new Map(existingOrders.map((o) => [o.code, o]));
      const flowers = useFlowerStore.getState().flowers;
      const flowerByCode = new Map(flowers.map((flower) => [flower.code.trim().toLowerCase(), flower]));
      const flowerByName = new Map(flowers.map((flower) => [flower.name.trim().toLowerCase(), flower]));
      // Bỏ các dòng trùng hoàn toàn do các lần đồng bộ cũ ghi lặp.
      const seenOrderRows = new Set<string>();
      const uniqueOrderRows = donHangRows.filter((row) => {
        const key = JSON.stringify(row.slice(0, 18));
        if (seenOrderRows.has(key)) return false;
        seenOrderRows.add(key);
        return true;
      });
      const seenDetailRows = new Set<string>();
      const detailRows = (sheetMap['CHI_TIET_DON_HANG'] || []).filter((row) => {
        const key = JSON.stringify(row.slice(0, 12));
        if (seenDetailRows.has(key)) return false;
        seenDetailRows.add(key);
        return true;
      });
      const itemsByOrderCode = new Map<string, OrderItem[]>();

      for (const row of detailRows) {
        const orderCode = String(row[0] || '').trim();
        const flowerCode = String(row[3] || '').trim();
        const flowerName = String(row[4] || '').trim();
        if (!orderCode || (!flowerCode && !flowerName)) continue;

        const previousItem = existingOrderMap.get(orderCode)?.items.find((item) =>
          (flowerCode && item.flowerCode.trim().toLowerCase() === flowerCode.toLowerCase()) ||
          (flowerName && item.flowerName.trim().toLowerCase() === flowerName.toLowerCase()),
        );
        const matchedFlower =
          flowerByCode.get(flowerCode.toLowerCase()) || flowerByName.get(flowerName.toLowerCase());
        const quantity = parseSheetNumber(row[5]);
        const costPrice = parseSheetNumber(row[7]);
        const unitPrice = parseSheetNumber(row[8]);
        const importTotal = parseSheetNumber(row[9]) || quantity * costPrice;
        const amount = parseSheetNumber(row[10]) || quantity * unitPrice;
        const item: OrderItem = {
          flowerId: matchedFlower?.id || previousItem?.flowerId || `hoa-sheet-${flowerCode || flowerName}`,
          flowerCode,
          flowerName,
          quantity,
          unit: String(row[6] || matchedFlower?.unit || previousItem?.unit || 'Cành').trim(),
          costPrice,
          unitPrice,
          importTotal,
          amount,
          profit: parseSheetNumber(row[11]) || amount - importTotal,
        };
        const currentItems = itemsByOrderCode.get(orderCode) || [];
        currentItems.push(item);
        itemsByOrderCode.set(orderCode, currentItems);
      }

      const orders = normalizeOrders(uniqueOrderRows.filter((r) => r[0] && r[1]).map((r, idx): Order => {
        const code = String(r[0] || '').trim();
        const prev = existingOrderMap.get(code);
        const sheetItems = itemsByOrderCode.get(code);

        // Nhận diện linh hoạt cấu trúc sheet DON_HANG:
        // Cũ 1 (19 cột): r[3]=SĐT, r[4]=Địa chỉ, r[5]=SL hoa, r[6]=Thành tiền, ..., r[16]=Người tạo
        // Mới A (17 cột, SL hoa sau Người tạo): r[3]=Thành tiền, ..., r[13]=Người tạo, r[14]=SL hoa, r[15]=Ghi chú
        // Mới B (17 cột, SL hoa ở đầu): r[3]=SL hoa, r[4]=Thành tiền, ..., r[14]=Người tạo, r[15]=Ghi chú
        const hasPhoneAddress =
          r.length >= 18 &&
          (isNaN(parseSheetNumber(r[3])) || isNaN(parseSheetNumber(r[4]))) &&
          !isNaN(parseSheetNumber(r[5]));

        const isQtyAfterCreator =
          !hasPhoneAddress &&
          r.length >= 15 &&
          isNaN(parseSheetNumber(r[13])) &&
          !isNaN(parseSheetNumber(r[14])) &&
          parseSheetNumber(r[14]) > 0;

        let totalQuantity = 0;
        let itemsSubtotal = 0;
        let shippingFee = 0;
        let discount = 0;
        let totalAmount = 0;
        let oldDebt = 0;
        let totalPayment = 0;
        let paidAmount = 0;
        let debtAmount = 0;
        let status: Order['status'] = 'nhap';
        let paymentStatus: Order['paymentStatus'] = 'unpaid';
        let creator = '';
        let notes = '';

        if (hasPhoneAddress) {
          totalQuantity = parseSheetNumber(r[5]) || prev?.totalQuantity || 0;
          itemsSubtotal = parseSheetNumber(r[6]) || prev?.itemsSubtotal || 0;
          shippingFee = parseSheetNumber(r[7]) || prev?.shippingFee || 0;
          discount = parseSheetNumber(r[8]) || prev?.discount || 0;
          totalAmount = parseSheetNumber(r[9]) || prev?.totalAmount || 0;
          oldDebt = parseSheetNumber(r[10]) || prev?.oldDebt || 0;
          totalPayment = parseSheetNumber(r[11]) || prev?.totalPayment || 0;
          paidAmount = parseSheetNumber(r[12]) || prev?.paidAmount || 0;
          debtAmount = parseSheetNumber(r[13]) || prev?.debtAmount || 0;
          status = (String(r[14] || prev?.status || 'nhap').trim()) as Order['status'];
          paymentStatus = (String(r[15] || prev?.paymentStatus || 'unpaid').trim()) as Order['paymentStatus'];
          creator = String(r[16] || '').trim() || prev?.creator || '';
          notes = String(r[17] || '').trim() || prev?.notes || '';
        } else if (isQtyAfterCreator) {
          itemsSubtotal = parseSheetNumber(r[3]) || prev?.itemsSubtotal || 0;
          shippingFee = parseSheetNumber(r[4]) || prev?.shippingFee || 0;
          discount = parseSheetNumber(r[5]) || prev?.discount || 0;
          totalAmount = parseSheetNumber(r[6]) || prev?.totalAmount || 0;
          oldDebt = parseSheetNumber(r[7]) || prev?.oldDebt || 0;
          totalPayment = parseSheetNumber(r[8]) || prev?.totalPayment || 0;
          paidAmount = parseSheetNumber(r[9]) || prev?.paidAmount || 0;
          debtAmount = parseSheetNumber(r[10]) || prev?.debtAmount || 0;
          status = (String(r[11] || prev?.status || 'nhap').trim()) as Order['status'];
          paymentStatus = (String(r[12] || prev?.paymentStatus || 'unpaid').trim()) as Order['paymentStatus'];
          creator = String(r[13] || '').trim() || prev?.creator || '';
          totalQuantity = parseSheetNumber(r[14]) || prev?.totalQuantity || 0;
          notes = String(r[15] || '').trim() || prev?.notes || '';
        } else {
          totalQuantity = parseSheetNumber(r[3]) || prev?.totalQuantity || 0;
          itemsSubtotal = parseSheetNumber(r[4]) || prev?.itemsSubtotal || 0;
          shippingFee = parseSheetNumber(r[5]) || prev?.shippingFee || 0;
          discount = parseSheetNumber(r[6]) || prev?.discount || 0;
          totalAmount = parseSheetNumber(r[7]) || prev?.totalAmount || 0;
          oldDebt = parseSheetNumber(r[8]) || prev?.oldDebt || 0;
          totalPayment = parseSheetNumber(r[9]) || prev?.totalPayment || 0;
          paidAmount = parseSheetNumber(r[10]) || prev?.paidAmount || 0;
          debtAmount = parseSheetNumber(r[11]) || prev?.debtAmount || 0;
          status = (String(r[12] || prev?.status || 'nhap').trim()) as Order['status'];
          paymentStatus = (String(r[13] || prev?.paymentStatus || 'unpaid').trim()) as Order['paymentStatus'];
          creator = String(r[14] || '').trim() || prev?.creator || '';
          notes = String(r[15] || '').trim() || prev?.notes || '';
        }

        return {
          id: prev?.id || `dh-sync-${idx + 1}`,
          code,
          orderDate: fromSheetDate(r[1]),
          distributorName: String(r[2] || '').trim(),
          phone: hasPhoneAddress ? String(r[3] || '').trim() : (prev?.phone || ''),
          address: hasPhoneAddress ? String(r[4] || '').trim() : (prev?.address || ''),
          totalQuantity,
          itemsSubtotal,
          shippingFee,
          discount,
          totalAmount,
          oldDebt,
          totalPayment,
          paidAmount,
          debtAmount,
          status,
          paymentStatus,
          creator,
          notes,
          // Ưu tiên chi tiết từ Sheets; chỉ giữ dữ liệu cục bộ khi sheet chưa có dòng chi tiết.
          items: sheetItems?.length ? sheetItems : (prev?.items || []),
          updatedAt: prev?.updatedAt,
        };
      }));
      useOrderStore.setState({ orders });
      counts['don_hang'] = orders.length;
    }

    // --- 9. DON_NHAP_NCC ---
    const donNhapRows = sheetMap['DON_NHAP_NCC'] || [];
    if (donNhapRows.length > 0) {
      const existingSupplierOrders = useSupplierOrderStore.getState().orders;
      const existingSupplierOrderMap = new Map(existingSupplierOrders.map((o) => [o.code, o]));
      const supplierOrders: SupplierOrder[] = donNhapRows.filter((r) => r[0] && r[1]).map((r, idx) => {
        const code = String(r[0] || '').trim();
        const prev = existingSupplierOrderMap.get(code);
        return {
          id: prev?.id || `po-sync-${idx + 1}`,
          code,
          orderDate: fromSheetDate(r[1]),
          supplierName: String(r[2] || '').trim(),
          totalQuantity: parseSheetNumber(r[3]) || prev?.totalQuantity || 0,
          itemsSubtotal: parseSheetNumber(r[4]) || prev?.itemsSubtotal || 0,
          shippingFee: parseSheetNumber(r[5]) || prev?.shippingFee || 0,
          discount: 0,
          totalAmount: parseSheetNumber(r[6]) || prev?.totalAmount || 0,
          paidAmount: parseSheetNumber(r[7]) || prev?.paidAmount || 0,
          debtAmount: parseSheetNumber(r[8]) || prev?.debtAmount || 0,
          status: (String(r[9] || prev?.status || 'nhap').trim()) as SupplierOrder['status'],
          paymentStatus: 'unpaid' as SupplierOrder['paymentStatus'],
          creator: String(r[10] || '').trim() || prev?.creator || '',
          notes: String(r[11] || '').trim() || prev?.notes || '',
          items: prev?.items || [],
        };
      });
      useSupplierOrderStore.setState({ orders: supplierOrders });
      counts['don_nhap_ncc'] = supplierOrders.length;
    }

    // Tự động đồng bộ toàn bộ đơn hàng vào sổ công nợ (có đơn thì có công nợ)
    syncAllOrdersToDebtRecords();

    // Tự động tính toán lại toàn bộ doanh số bán hoa, công nợ cũ, đã trả, nợ cuối cho NPP & NCC
    recalcAllDistributorsDebts();
    recalcAllSuppliersDebts();

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
  } finally {
    resumeAudit?.();
  }
}
