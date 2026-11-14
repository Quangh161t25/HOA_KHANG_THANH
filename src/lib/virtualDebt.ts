/**
 * CÔNG NỢ ẢO TỪ ĐƠN HÀNG
 * Mỗi đơn hàng bán / đơn nhập NCC (không hủy) sinh ra các dòng công nợ ảo — tính khi hiển thị, không lưu:
 *  - 1 dòng "Chi" = tiền hàng của đơn (tăng nợ)
 *  - 1 dòng "Thu" = số tiền đã trả ngay trong đơn (giảm nợ), nếu có
 * Sửa đơn hàng → các dòng này tự đổi theo. Ở module Công nợ không sửa / xóa được.
 * Sổ công nợ (useDebtStore) chỉ còn các dòng NHẬP TAY: phiếu thu, nợ đầu kỳ, điều chỉnh...
 */
import { useMemo } from 'react';
import type { DebtDailyRecord, Distributor, Order, Supplier, SupplierOrder } from '@/types/hoaKhangThanh';
import {
  getOrderTotal,
  normalizeToISODate,
  useDebtStore,
  useDistributorStore,
  useOrderStore,
  useSupplierOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import { computeAllOrdersVirtualDebt } from '@/lib/orderDebtHelper';

const lower = (s?: string) => (s || '').trim().toLowerCase();

export function buildOrderDebtRows(
  orders: Order[],
  supplierOrders: SupplierOrder[],
  distributors: Distributor[],
  suppliers: Supplier[],
  manualRecords: DebtDailyRecord[],
): DebtDailyRecord[] {
  const rows: DebtDailyRecord[] = [];

  // Tra cứu NPP / NCC nhanh
  const distById = new Map(distributors.map((d) => [d.id, d]));
  const distByName = new Map(distributors.map((d) => [lower(d.name), d]));
  const supById = new Map(suppliers.map((s) => [s.id, s]));
  const supByName = new Map(suppliers.map((s) => [lower(s.name), s]));

  // Công nợ cũ / còn lại theo dòng thời gian của từng khách (đã có sẵn ở module Đơn hàng)
  const orderDebt = computeAllOrdersVirtualDebt(orders, manualRecords, distributors);

  for (const o of orders) {
    if (o.status === 'huy' || o.status === 'cancelled') continue;
    const dist = (o.distributorId && distById.get(o.distributorId)) || distByName.get(lower(o.distributorName));
    const partnerId = dist?.id || o.distributorId || `npp-name-${lower(o.distributorName)}`;
    const date = normalizeToISODate(o.orderDate);
    const total = getOrderTotal(o);
    const paid = o.paidAmount || 0;
    const v = orderDebt.get(o.id);
    const base = {
      date,
      partnerType: 'npp' as const,
      partnerId,
      partnerCode: dist?.code || '',
      partnerName: o.distributorName,
      phone: o.phone || dist?.phone || '',
      entryType: 'order' as const,
      referenceCode: o.code,
      creator: o.creator || '',
      isVirtual: true,
      sourceOrderId: o.id,
      sourceKind: 'order' as const,
    };

    rows.push({
      ...base,
      id: `vdebt-dh-${o.id}`,
      type: 'chi',
      amount: total,
      increaseAmount: total,
      decreaseAmount: 0,
      oldDebt: v?.oldDebt,
      finalDebt: v ? v.oldDebt + total : undefined,
      notes: o.notes ? `Đơn hàng ${o.code}: ${o.notes}` : `Đơn hàng ${o.code}`,
    });

    if (paid > 0) {
      rows.push({
        ...base,
        id: `vdebt-dh-pay-${o.id}`,
        type: 'thu',
        amount: paid,
        increaseAmount: 0,
        decreaseAmount: paid,
        finalDebt: v?.finalDebt,
        notes: `Thanh toán khi giao đơn ${o.code}`,
      });
    }
  }

  for (const po of supplierOrders) {
    if (po.status === 'huy') continue;
    const sup = (po.supplierId && supById.get(po.supplierId)) || supByName.get(lower(po.supplierName));
    const partnerId = sup?.id || po.supplierId || `ncc-name-${lower(po.supplierName)}`;
    const date = normalizeToISODate(po.orderDate);
    const total = getOrderTotal(po, 'costPrice');
    const paid = po.paidAmount || 0;
    const base = {
      date,
      partnerType: 'ncc' as const,
      partnerId,
      partnerCode: sup?.code || '',
      partnerName: po.supplierName,
      phone: po.phone || sup?.phone || '',
      entryType: 'order' as const,
      referenceCode: po.code,
      creator: po.creator || '',
      isVirtual: true,
      sourceOrderId: po.id,
      sourceKind: 'supplierOrder' as const,
    };

    rows.push({
      ...base,
      id: `vdebt-ncc-${po.id}`,
      type: 'chi',
      amount: total,
      increaseAmount: total,
      decreaseAmount: 0,
      notes: po.notes ? `Đơn nhập NCC ${po.code}: ${po.notes}` : `Đơn nhập NCC ${po.code}`,
    });

    if (paid > 0) {
      rows.push({
        ...base,
        id: `vdebt-ncc-pay-${po.id}`,
        type: 'thu',
        amount: paid,
        increaseAmount: 0,
        decreaseAmount: paid,
        notes: `Trả tiền khi nhập đơn ${po.code}`,
      });
    }
  }

  return rows;
}

/**
 * Toàn bộ dòng công nợ để HIỂN THỊ: dòng ảo từ đơn + dòng nhập tay đã lưu.
 * Dùng cho các màn hình liệt kê công nợ. Các hàm tính tổng nợ (calculateDistributorFinancials...)
 * vẫn nhận sổ nhập tay + danh sách đơn như cũ.
 */
export function useAllDebtRecords(): DebtDailyRecord[] {
  const manual = useDebtStore((s) => s.records);
  const orders = useOrderStore((s) => s.orders);
  const supplierOrders = useSupplierOrderStore((s) => s.orders);
  const distributors = useDistributorStore((s) => s.distributors);
  const suppliers = useSupplierStore((s) => s.suppliers);

  return useMemo(
    () => [...buildOrderDebtRows(orders, supplierOrders, distributors, suppliers, manual), ...manual],
    [manual, orders, supplierOrders, distributors, suppliers],
  );
}

/**
 * Lấy mã chứng từ / mã hiển thị thân thiện cho dòng công nợ:
 * - Nếu có referenceCode (DH-..., PO-..., PT-..., PC-...): hiển thị mã đó
 * - Nếu không có:
 *   + Thu: "Thu nợ đối tác"
 *   + Chi NPP: "Bán hoa trong ngày"
 *   + Chi NCC: "Nhập hoa NCC"
 */
export function getRecordReferenceCode(r?: DebtDailyRecord | null): string {
  if (!r) return '';
  if (r.referenceCode && r.referenceCode.trim()) return r.referenceCode.trim();
  const isOrder =
    r.entryType === 'order' ||
    Boolean(r.referenceCode && (r.referenceCode.startsWith('DH-') || r.referenceCode.startsWith('PO-')));
  if (isOrder) return '';
  const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
  if (isThu) return 'Thu nợ đối tác';
  return r.partnerType === 'ncc' ? 'Nhập hoa NCC' : 'Bán hoa trong ngày';
}
