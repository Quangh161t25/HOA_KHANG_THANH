import { toSheetDate, toSheetDateTime } from './sheetDate.js';

/** Dữ liệu từ các store gửi lên Google Sheets */
export interface SheetSyncBody {
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
}

export interface SheetTable {
  /** Dạng 'TEN_SHEET!A2:X'; tên sheet là phần trước dấu ! */
  range: string;
  values: any[][];
}

/**
 * Chuyển dữ liệu app thành các bảng (từ dòng 2) cho từng sheet.
 * Dùng chung cho server (Vite/Vercel) và bản GitHub Pages (gọi Google Apps Script).
 */
export function buildSheetTables(body: SheetSyncBody): SheetTable[] {
  const batchData: SheetTable[] = [];

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
        toSheetDate(o.orderDate),
        o.distributorName || '',
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
        totalQty,
        o.notes || '',
        toSheetDateTime(),
      ];
    });

    // Clear old data from row 2, then write new (17 columns A to Q, bỏ SĐT và Địa chỉ)
    batchData.push({
      range: 'DON_HANG!A2:Q' + Math.max(2, rows.length + 1),
      values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']],
    });

    // 2. CHI_TIET_DON_HANG (Thứ tự mới: Mã ĐH, Ngày, Khách hàng, Mã hoa, Giá bán, SL, TT bán, Giá vốn, TT vốn, Lợi nhuận, Tên hoa, ĐVT)
    const detailRows: any[][] = [];
    body.orders.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const qty = item.quantity || 0;
        const cost = item.costPrice || 0;
        const price = item.unitPrice || 0;
        const importTot = item.importTotal ?? (qty * cost);
        const amt = item.amount ?? (qty * price);
        const prof = item.profit ?? (amt - importTot);

        detailRows.push([
          o.code || '',
          toSheetDate(o.orderDate),
          o.distributorName || '',
          item.flowerCode || '',
          price,
          qty,
          amt,
          cost,
          importTot,
          prof,
          item.flowerName || '',
          item.unit || 'cành',
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
      f.customName || '',
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
      toSheetDate(d.lastOrderDate),
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
      toSheetDate(so.orderDate),
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

  // 7a. CONG_NO_NPP (10 cột: Mã công nợ / ID ở đầu, Ngày ghi nhận, NPP / Khách hàng, Loại đối tác, Loại giao dịch, Số tiền, Công nợ lũy kế, Mã đơn, Người phụ trách, Ghi chú)
  if (body.debtRecords) {
    const nppRecords = body.debtRecords.filter((r) => r.partnerType === 'npp');
    const nppRows = nppRecords.map((r, idx) => [
      r.id || `CN-NPP-${String(idx + 1).padStart(4, '0')}`,
      toSheetDate(r.date),
      r.partnerName || '',
      'NPP',
      r.type || r.entryType || '',
      r.amount || 0,
      r.remainingDebt || r.finalDebt || 0,
      r.referenceCode || '',
      r.creator || '',
      r.notes || '',
    ]);
    batchData.push({
      range: 'CONG_NO_NPP!A2:J' + Math.max(2, nppRows.length + 1),
      values: nppRows.length > 0 ? nppRows : [['', '', '', '', '', '', '', '', '', '']],
    });

    // 7b. CONG_NO_NCC (10 cột: Mã công nợ / ID ở đầu, Ngày ghi nhận, Nhà Cung Cấp, Loại đối tác, Loại giao dịch, Số tiền, Công nợ lũy kế, Lô nhập / Chứng từ, Người phụ trách, Ghi chú)
    const nccRecords = body.debtRecords.filter((r) => r.partnerType === 'ncc');
    const nccRows = nccRecords.map((r, idx) => [
      r.id || `CN-NCC-${String(idx + 1).padStart(4, '0')}`,
      toSheetDate(r.date),
      r.partnerName || '',
      'NCC',
      r.type || r.entryType || '',
      r.amount || 0,
      r.remainingDebt || r.finalDebt || 0,
      r.referenceCode || '',
      r.creator || '',
      r.notes || '',
    ]);
    batchData.push({
      range: 'CONG_NO_NCC!A2:J' + Math.max(2, nccRows.length + 1),
      values: nccRows.length > 0 ? nccRows : [['', '', '', '', '', '', '', '', '', '']],
    });
  }

  // 8. THU_CHI
  if (body.transactions) {
    const rows = body.transactions.map((t) => [
      t.code || '',
      toSheetDate(t.date),
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
      toSheetDate(inv.lastImportDate),
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
      toSheetDate(e.joinDate),
      e.salary || 0,
      e.status || 'Đang làm việc',
      e.password || '123456',
    ]);
    batchData.push({
      range: 'NHAN_VIEN!A2:L' + Math.max(2, rows.length + 1),
      values: rows.length > 0 ? rows : [['', '', '', '', '', '', '', '', '', '', '', '']],
    });
  }

  // 11. LICH_SU_THAO_TAC
  if (body.auditLogs) {
    const rows = body.auditLogs.map((l) => [
      l.id || '',
      l.timestamp ? toSheetDateTime(l.timestamp) : '',
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

  return batchData;
}
