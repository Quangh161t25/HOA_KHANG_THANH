import type { DebtDailyRecord, Distributor, Order } from '@/types/hoaKhangThanh';
import { normalizeToISODate } from '@/stores/hoaKhangThanhStore';

export interface OrderDebtInfo {
  oldDebt: number; // Công nợ cũ trước đơn này (nếu < 0 nghĩa là khách đang dư/thừa tiền)
  totalPayment: number; // Thanh toán = Tổng tiền + oldDebt (nếu oldDebt < 0 thì tự trừ tiền dư)
  finalDebt: number; // Công nợ còn lại sau đơn này
}

/**
 * Tính toán CỘT ẢO CÔNG NỢ CŨ & THANH TOÁN (Real-time Running Balance)
 * Cho toàn bộ danh sách đơn hàng dựa trên dòng thời gian phát sinh thực tế
 */
export function computeAllOrdersVirtualDebt(
  orders: Order[],
  debtRecords: DebtDailyRecord[],
  distributors: Distributor[],
): Map<string, OrderDebtInfo> {
  const result = new Map<string, OrderDebtInfo>();

  // 1. Gom nhóm danh sách đơn hàng và sổ công nợ theo từng Khách hàng / NPP
  const partnerGroups = new Map<
    string,
    {
      dist?: Distributor;
      orders: Order[];
      records: DebtDailyRecord[];
    }
  >();

  // Khởi tạo nhóm từ NPP
  distributors.forEach((d) => {
    partnerGroups.set(d.id, { dist: d, orders: [], records: [] });
  });

  // Gán đơn hàng vào nhóm đối tác
  orders.forEach((o) => {
    const pKey = o.distributorId || (o.distributorName ? o.distributorName.trim().toLowerCase() : '');
    if (!pKey) return;
    if (!partnerGroups.has(pKey)) {
      const foundDist = distributors.find(
        (d) =>
          d.id === pKey ||
          (o.distributorName && d.name.trim().toLowerCase() === o.distributorName.trim().toLowerCase()),
      );
      partnerGroups.set(pKey, { dist: foundDist, orders: [], records: [] });
    }
    partnerGroups.get(pKey)!.orders.push(o);
  });

  // Gán các bản ghi công nợ vào nhóm đối tác
  debtRecords.forEach((r) => {
    if (r.partnerType !== 'npp') return;
    const pKey = r.partnerId || (r.partnerName ? r.partnerName.trim().toLowerCase() : '');
    if (!pKey) return;
    if (!partnerGroups.has(pKey)) {
      const foundDist = distributors.find(
        (d) =>
          d.id === pKey ||
          (r.partnerName && d.name.trim().toLowerCase() === r.partnerName.trim().toLowerCase()),
      );
      partnerGroups.set(pKey, { dist: foundDist, orders: [], records: [] });
    }
    partnerGroups.get(pKey)!.records.push(r);
  });

  // 2. Tính toán chuỗi lũy kế số dư thời gian cho từng khách hàng
  partnerGroups.forEach((group) => {
    const { dist, orders: pOrders, records: pRecords } = group;
    const baseDebt = dist?.oldDebt || 0;

    const allTimelineEntries: {
      id: string;
      date: string;
      isThu: boolean;
      amount: number;
      orderId?: string;
      orderCode?: string;
    }[] = [];

    // Thêm các bản ghi từ sổ công nợ
    pRecords.forEach((r) => {
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt =
        r.amount !== undefined
          ? r.amount
          : isThu
          ? r.decreaseAmount || 0
          : r.increaseAmount || 0;

      const matchedOrder = pOrders.find(
        (o) =>
          o.code === r.referenceCode ||
          o.id === r.referenceCode ||
          r.id === `debt-dh-${o.id}` ||
          r.id === `debt-order-${o.id}` ||
          (r.notes && o.code && r.notes.includes(o.code)),
      );

      allTimelineEntries.push({
        id: r.id,
        date: normalizeToISODate(r.date),
        isThu,
        amount: amt,
        orderId: matchedOrder?.id,
        orderCode: matchedOrder?.code || r.referenceCode,
      });
    });

    // Bổ sung các đơn hàng chưa có trong debtRecords
    pOrders.forEach((o) => {
      const alreadyIn = allTimelineEntries.some(
        (e) => e.orderId === o.id || e.orderCode === o.code || e.id === `debt-dh-${o.id}`,
      );
      if (!alreadyIn) {
        allTimelineEntries.push({
          id: `debt-dh-${o.id}`,
          date: normalizeToISODate(o.orderDate),
          isThu: false,
          amount: o.totalAmount || 0,
          orderId: o.id,
          orderCode: o.code,
        });
      }
    });

    // Sắp xếp dòng thời gian theo trình tự cũ nhất -> mới nhất
    allTimelineEntries.sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      if (dc !== 0) return dc;
      // Cùng ngày: Chi (bán hàng nợ) trước, Thu (trả nợ) sau
      if (!a.isThu && b.isThu) return -1;
      if (a.isThu && !b.isThu) return 1;
      return a.id.localeCompare(b.id);
    });

    // 3. Tính Running Balance lũy kế qua từng giao dịch
    let running = baseDebt;
    allTimelineEntries.forEach((entry) => {
      if (entry.orderId) {
        const ord = pOrders.find((o) => o.id === entry.orderId);
        const total = ord?.totalAmount !== undefined ? ord.totalAmount : entry.amount;
        const priorDebt = running;
        const totalPayment = total + priorDebt;
        const finalDebt = totalPayment;

        result.set(entry.orderId, {
          oldDebt: priorDebt,
          totalPayment,
          finalDebt,
        });
      }

      if (entry.isThu) {
        running -= entry.amount;
      } else {
        running += entry.amount;
      }
    });
  });

  return result;
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
