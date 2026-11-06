import type { DebtDailyRecord, Distributor, Order } from '@/types/hoaKhangThanh';
import { normalizeToISODate } from '@/stores/hoaKhangThanhStore';
import { parseDateTimestamp } from '@/lib/format';

export interface OrderDebtInfo {
  oldDebt: number; // Công nợ cũ trước đơn này (nếu < 0 nghĩa là khách đang dư/thừa tiền)
  totalPayment: number; // Thanh toán = Tổng tiền + oldDebt (nếu oldDebt < 0 thì tự trừ tiền dư)
  finalDebt: number; // Công nợ còn lại sau đơn này
}

/**
 * Chuẩn hóa và ánh xạ định danh đối tác (NPP / Khách hàng) về cùng một mã đại diện duy nhất.
 * Xử lý trường hợp đơn hàng kéo từ Google Sheets (chỉ có tên distributorName)
 * và đơn hàng tạo trên Web (có cả distributorId).
 */
export function getCanonicalPartnerKey(
  partnerId?: string,
  partnerName?: string,
  distributors: Distributor[] = [],
): string {
  const normName = (partnerName || '').trim().toLowerCase();

  // 1. Tìm theo partnerId
  if (partnerId) {
    const pIdLower = partnerId.toLowerCase();
    for (let i = 0; i < distributors.length; i++) {
      const d = distributors[i];
      if (d.id === partnerId || (d.code && d.code.toLowerCase() === pIdLower)) {
        return d.id;
      }
    }
  }

  // 2. Tìm theo partnerName
  if (normName) {
    for (let i = 0; i < distributors.length; i++) {
      const d = distributors[i];
      if (d.name && d.name.trim().toLowerCase() === normName) {
        return d.id;
      }
    }
  }

  // 3. Fallback: normalize name hoặc id
  return normName || (partnerId ? partnerId.trim().toLowerCase() : '');
}

/**
 * Tính toán CỘT ẢO CÔNG NỢ CŨ & THANH TOÁN (Real-time Running Balance)
 * Cho toàn bộ danh sách đơn hàng dựa trên dòng thời gian phát sinh thực tế.
 * Tự động cập nhật công nợ cũ và tổng thanh toán của mọi đơn hàng liên quan khi chèn đơn vào giữa các ngày.
 */
export function computeAllOrdersVirtualDebt(
  orders: Order[],
  debtRecords: DebtDailyRecord[],
  distributors: Distributor[],
): Map<string, OrderDebtInfo> {
  const result = new Map<string, OrderDebtInfo>();

  // Map tra cứu nhanh O(1) để tránh vòng lặp quét qua distributors
  const idToKey = new Map<string, string>();
  const nameToKey = new Map<string, string>();

  distributors.forEach((d) => {
    idToKey.set(d.id, d.id);
    if (d.code) idToKey.set(d.code.toLowerCase(), d.id);
    if (d.name) nameToKey.set(d.name.trim().toLowerCase(), d.id);
  });

  const getFastKey = (id?: string, name?: string): string => {
    if (id && idToKey.has(id)) return idToKey.get(id)!;
    if (id && idToKey.has(id.toLowerCase())) return idToKey.get(id.toLowerCase())!;
    const norm = (name || '').trim().toLowerCase();
    if (norm && nameToKey.has(norm)) return nameToKey.get(norm)!;
    return norm || (id ? id.trim().toLowerCase() : '');
  };

  // 1. Gom nhóm danh sách đơn hàng và sổ công nợ theo từng Khách hàng / NPP (sử dụng Canonical Key)
  const partnerGroups = new Map<
    string,
    {
      dist?: Distributor;
      orders: Order[];
      records: DebtDailyRecord[];
    }
  >();

  // Khởi tạo nhóm từ danh sách NPP
  distributors.forEach((d) => {
    partnerGroups.set(d.id, { dist: d, orders: [], records: [] });
  });

  // Gán đơn hàng vào đúng nhóm đối tác
  orders.forEach((o) => {
    const pKey = getFastKey(o.distributorId, o.distributorName);
    if (!pKey) return;
    let group = partnerGroups.get(pKey);
    if (!group) {
      const foundDist = distributors.find((d) => d.id === pKey || d.name.trim().toLowerCase() === pKey);
      group = { dist: foundDist, orders: [], records: [] };
      partnerGroups.set(pKey, group);
    }
    group.orders.push(o);
  });

  // Gán các bản ghi công nợ vào đúng nhóm đối tác
  debtRecords.forEach((r) => {
    if (r.partnerType !== 'npp') return;
    const pKey = getFastKey(r.partnerId, r.partnerName);
    if (!pKey) return;
    let group = partnerGroups.get(pKey);
    if (!group) {
      const foundDist = distributors.find((d) => d.id === pKey || d.name.trim().toLowerCase() === pKey);
      group = { dist: foundDist, orders: [], records: [] };
      partnerGroups.set(pKey, group);
    }
    group.records.push(r);
  });

  // 2. Tính toán chuỗi lũy kế số dư thời gian cho từng khách hàng
  partnerGroups.forEach((group) => {
    const { dist, orders: pOrders, records: pRecords } = group;
    const baseDebt = dist?.oldDebt || 0;

    if (pOrders.length === 0 && pRecords.length === 0) {
      return;
    }

    interface TimelineEntry {
      id: string;
      date: string;
      dateTime: number;
      isThu: boolean;
      amount: number;
      paidAmount: number;
      orderId?: string;
      orderCode?: string;
    }

    const allTimelineEntries: TimelineEntry[] = [];

    // Thêm các đơn hàng vào dòng thời gian
    pOrders.forEach((o) => {
      const isoDate = normalizeToISODate(o.orderDate);
      allTimelineEntries.push({
        id: `order-${o.id}`,
        date: isoDate,
        dateTime: parseDateTimestamp(isoDate) ?? 0,
        isThu: false,
        amount: o.totalAmount || 0,
        paidAmount: o.paidAmount || 0,
        orderId: o.id,
        orderCode: o.code,
      });
    });

    // Thêm các giao dịch ngoài đơn hàng từ sổ công nợ
    const orderCodes = new Set(pOrders.map((o) => o.code));
    const orderIds = new Set(pOrders.map((o) => o.id));

    pRecords.forEach((r) => {
      const isLinkedToOrder =
        (r.referenceCode && orderCodes.has(r.referenceCode)) ||
        (r.referenceCode && orderIds.has(r.referenceCode)) ||
        pOrders.some((o) => r.id === `debt-dh-${o.id}` || r.id === `debt-order-${o.id}`);

      if (isLinkedToOrder) return;

      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt =
        r.amount !== undefined
          ? r.amount
          : isThu
          ? r.decreaseAmount || 0
          : r.increaseAmount || 0;

      const isoDate = normalizeToISODate(r.date);
      allTimelineEntries.push({
        id: r.id,
        date: isoDate,
        dateTime: parseDateTimestamp(isoDate) ?? 0,
        isThu,
        amount: amt,
        paidAmount: 0,
      });
    });

    // Sắp xếp dòng thời gian theo trình tự cũ nhất -> mới nhất
    allTimelineEntries.sort((a, b) => {
      if (a.dateTime !== b.dateTime) return a.dateTime - b.dateTime;
      if (!a.isThu && b.isThu) return -1;
      if (a.isThu && !b.isThu) return 1;
      return (a.orderCode || a.id).localeCompare(b.orderCode || b.id, undefined, { numeric: true });
    });

    // 3. Tính Running Balance lũy kế qua từng giao dịch
    let running = baseDebt;

    allTimelineEntries.forEach((entry) => {
      if (entry.orderId) {
        const priorDebt = running;
        const totalPayment = (entry.amount || 0) + priorDebt;
        const finalDebt = totalPayment - (entry.paidAmount || 0);

        result.set(entry.orderId, {
          oldDebt: priorDebt,
          totalPayment,
          finalDebt,
        });

        running = finalDebt;
      } else if (entry.isThu) {
        running -= entry.amount;
      } else {
        running += entry.amount;
      }
    });
  });

  return result;
}

/**
 * Lấy số dư công nợ của một đối tác tính tới một mốc ngày cụ thể.
 * Dùng khi tạo đơn hàng mới vào giữa các ngày để tự động điền Công nợ cũ chính xác.
 */
export function getDistributorDebtAsOfDate(
  partnerId?: string,
  partnerName?: string,
  targetDate?: string,
  orders: Order[] = [],
  debtRecords: DebtDailyRecord[] = [],
  distributors: Distributor[] = [],
  excludeOrderId?: string,
): number {
  const pKey = getCanonicalPartnerKey(partnerId, partnerName, distributors);
  if (!pKey) return 0;

  const dist = distributors.find((d) => d.id === pKey || d.name.trim().toLowerCase() === pKey);
  let running = dist?.oldDebt || 0;

  const targetTime = targetDate ? (parseDateTimestamp(targetDate) ?? Infinity) : Infinity;
  const pNameLower = (dist?.name || partnerName || '').trim().toLowerCase();

  // Lấy đơn hàng của đối tác này bằng so khớp trực tiếp O(1)
  const pOrders = orders.filter((o) => {
    if (excludeOrderId && o.id === excludeOrderId) return false;
    if (o.distributorId === pKey) return true;
    if (pNameLower && o.distributorName && o.distributorName.trim().toLowerCase() === pNameLower) return true;
    return false;
  });

  // Lấy bản ghi công nợ của đối tác này
  const pRecords = debtRecords.filter((r) => {
    if (r.partnerType !== 'npp') return false;
    if (r.partnerId === pKey) return true;
    if (pNameLower && r.partnerName && r.partnerName.trim().toLowerCase() === pNameLower) return true;
    return false;
  });

  if (pOrders.length === 0 && pRecords.length === 0) {
    return running;
  }

  interface TimelineEntry {
    date: string;
    dateTime: number;
    isThu: boolean;
    amount: number;
    paidAmount: number;
    orderCode?: string;
  }

  const entries: TimelineEntry[] = [];

  pOrders.forEach((o) => {
    const isoDate = normalizeToISODate(o.orderDate);
    entries.push({
      date: isoDate,
      dateTime: parseDateTimestamp(isoDate) ?? 0,
      isThu: false,
      amount: o.totalAmount || 0,
      paidAmount: o.paidAmount || 0,
      orderCode: o.code,
    });
  });

  const orderCodes = new Set(pOrders.map((o) => o.code));
  const orderIds = new Set(pOrders.map((o) => o.id));

  pRecords.forEach((r) => {
    const isLinkedToOrder =
      (r.referenceCode && orderCodes.has(r.referenceCode)) ||
      (r.referenceCode && orderIds.has(r.referenceCode)) ||
      pOrders.some((o) => r.id === `debt-dh-${o.id}` || r.id === `debt-order-${o.id}`);

    if (isLinkedToOrder) return;

    const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
    const amt =
      r.amount !== undefined
        ? r.amount
        : isThu
        ? r.decreaseAmount || 0
        : r.increaseAmount || 0;

    const isoDate = normalizeToISODate(r.date);
    entries.push({
      date: isoDate,
      dateTime: parseDateTimestamp(isoDate) ?? 0,
      isThu,
      amount: amt,
      paidAmount: 0,
    });
  });

  entries.sort((a, b) => {
    if (a.dateTime !== b.dateTime) return a.dateTime - b.dateTime;
    if (!a.isThu && b.isThu) return -1;
    if (a.isThu && !b.isThu) return 1;
    return (a.orderCode || '').localeCompare(b.orderCode || '', undefined, { numeric: true });
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // Chỉ tính các giao dịch diễn ra trước hoặc trong cùng ngày (nhưng trước đơn đang tạo)
    if (entry.dateTime > targetTime) {
      break;
    }
    if (entry.isThu) {
      running -= entry.amount;
    } else {
      running += (entry.amount || 0) - (entry.paidAmount || 0);
    }
  }

  return running;
}

/**
 * Định dạng hiển thị Công nợ cũ:
 * - Nếu < 0: hiển thị "Dư: 2.950.000" (màu xanh lá)
 * - Nếu > 0: hiển thị "7.050.000" (màu hổ phách)
 * - Nếu = 0: hiển thị "0"
 */
export function formatOldDebtDisplay(amount: number): {
  text: string;
  className: string;
  isCredit: boolean;
} {
  const val = amount || 0;
  if (val < 0) {
    return {
      text: `Dư: ${Math.abs(val).toLocaleString('vi-VN')}`,
      className: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
      isCredit: true,
    };
  }
  if (val > 0) {
    return {
      text: val.toLocaleString('vi-VN'),
      className: 'text-amber-600 dark:text-amber-400 font-bold',
      isCredit: false,
    };
  }
  return {
    text: '0',
    className: 'text-muted-foreground',
    isCredit: false,
  };
}
