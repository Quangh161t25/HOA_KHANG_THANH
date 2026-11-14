import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Lock,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useDebtStore, useOrderStore } from '@/stores/hoaKhangThanhStore';
import { useAuthStore } from '@/stores/auth';
import { usePermissionStore } from '@/stores/permissionStore';
import type { Order } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';
import { checkCustomerOverdueDebt } from '@/lib/debtCheck';
import { HoaDonPrintModal, generateInvoiceUrl } from './HoaDonPrintModal';

interface Props {
  order: Order | null;
  onClose: () => void;
  onEdit?: (order: Order) => void;
}

export function DonHangDetailModal({ order, onClose, onEdit }: Props) {
  const { orders, updateOrderStatus } = useOrderStore();
  const debtRecords = useDebtStore((s) => s.records);
  const currentUser = useAuthStore((s) => s.user);
  const getOrderItemRights = usePermissionStore((s) => s.getOrderItemRights);

  const itemRights = useMemo(() => {
    return getOrderItemRights(currentUser?.id || '');
  }, [currentUser?.id, getOrderItemRights]);

  const debtCheck = useMemo(() => {
    if (!order) return null;
    return checkCustomerOverdueDebt(
      order.distributorId || '',
      order.distributorName,
      orders,
      order.id,
      order.orderDate,
      debtRecords,
    );
  }, [order, orders, debtRecords]);

  if (!order) return null;

  // Format number WITHOUT currency symbol (no ₫)
  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleStatusChange = (newStatus: Order['status']) => {
    updateOrderStatus(order.id, newStatus);
    toast.success('Đã cập nhật trạng thái đơn hàng');
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const totalQuantity =
    order.totalQuantity || order.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsSubtotal =
    order.itemsSubtotal || order.items.reduce((sum, i) => sum + i.amount, 0);
  const shippingFee = order.shippingFee || 0;
  const discount = order.discount || 0;
  const totalAmount = order.totalAmount || itemsSubtotal + shippingFee - discount;
  const oldDebt = order.oldDebt || 0;
  const totalPayment = order.totalPayment || (totalAmount + oldDebt);
  const totalCost =
    order.totalCost ||
    order.items.reduce((sum, i) => sum + (i.importTotal || (i.costPrice || 0) * i.quantity), 0);
  const totalProfit =
    order.totalProfit ||
    order.items.reduce((sum, i) => sum + (i.profit || i.amount - (i.costPrice || 0) * i.quantity), 0);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'nhap':
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            Nháp (Chờ duyệt)
          </span>
        );
      case 'da_xac_nhan':
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800">
            Đã xác nhận
          </span>
        );
      case 'dang_giao':
      case 'delivering':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800">
            Đang giao hàng
          </span>
        );
      case 'hoan_thanh':
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
            Hoàn thành
          </span>
        );
      case 'huy':
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-800">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Drawer
      title={`Chi tiết đơn hàng ${order.code}`}
      subtitle={`ID đơn: ${order.code} • Ngày đặt: ${formatDate(order.orderDate)}`}
      icon={<ShoppingCart size={18} />}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full print:hidden">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={order.status === 'da_xac_nhan' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange('da_xac_nhan')}
              className="gap-1 text-xs"
            >
              <Clock size={13} /> Xác nhận
            </Button>
            <Button
              size="sm"
              variant={order.status === 'dang_giao' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange('dang_giao')}
              className="gap-1 text-xs"
            >
              <Truck size={13} /> Đang giao
            </Button>
            <Button
              size="sm"
              variant={order.status === 'hoan_thanh' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange('hoan_thanh')}
              className="gap-1 text-xs text-emerald-600 border-emerald-300"
            >
              <CheckCircle2 size={13} /> Hoàn tất
            </Button>
            {order.status !== 'huy' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('huy')}
                className="gap-1 text-xs text-rose-600 border-rose-300"
              >
                <XCircle size={13} /> Hủy đơn
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.open(generateInvoiceUrl(order), '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors cursor-pointer"
              title="Mở phiếu in trong tab mới của trình duyệt"
            >
              <ExternalLink size={13} />
              <span>Mở tab mới</span>
            </button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1 text-xs">
              <Printer size={13} /> In phiếu
            </Button>
            {onEdit && itemRights.actions.edit && (
              <Button
                size="sm"
                onClick={() => onEdit(order)}
                className="gap-1 text-xs bg-primary text-primary-foreground font-semibold"
              >
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Khối thông tin khách hàng & đơn hàng */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10">
                {order.code}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ngày đặt: <strong className="text-foreground">{formatDate(order.orderDate)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                NPP / Khách hàng
              </span>
              <div className="text-sm font-bold text-foreground">{order.distributorName}</div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Người phụ trách đơn
              </span>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User size={13} className="text-primary" />
                {order.creator}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                Tổng số lượng hoa: <strong className="text-primary font-mono">{formatNumber(totalQuantity)}</strong>
              </div>
              {order.notes && (
                <div className="text-xs text-muted-foreground mt-2 italic p-2 rounded bg-muted/40 border border-border/50">
                  Ghi chú: "{order.notes}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CẢNH BÁO NẾU KHÁCH HÀNG CHƯA TRẢ NỢ ĐƠN QUÁ 4 NGÀY (FIFO) */}
        {debtCheck?.hasOverdueUnpaidDebt && debtCheck.earliestUnpaidOrder && (
          <div className="p-3.5 rounded-xl border-2 border-rose-400 bg-rose-50/95 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                <AlertTriangle size={16} />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <span>CẢNH BÁO: KHÁCH HÀNG CHƯA TRẢ NỢ (QUÁ 4 NGÀY)</span>
                  <span className="font-mono text-[11px] bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-bold">
                    {debtCheck.overdueOrders.length} đơn quá hạn (≥ 4 ngày)
                  </span>
                </div>
                <p className="mt-1 leading-relaxed text-rose-800 dark:text-rose-200">
                  Khách hàng có đơn cũ <strong className="font-mono font-bold text-rose-950 dark:text-white bg-rose-200/70 dark:bg-rose-900/70 px-1 py-0.5 rounded">{debtCheck.earliestUnpaidOrder.code}</strong> (ngày đặt {formatDate(debtCheck.earliestUnpaidOrder.orderDate)}, cách đây <strong className="font-bold text-rose-600 dark:text-rose-400">{debtCheck.earliestUnpaidOrder.daysAgo} ngày</strong>) chưa thanh toán đủ.
                </p>
                <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/60 flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Giá trị đơn cũ:</span>
                    <span className="font-mono font-bold">{formatNumber(debtCheck.earliestUnpaidOrder.totalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block">Đã trả (FIFO):</span>
                    <span className="font-mono font-bold text-emerald-600">{formatNumber(debtCheck.earliestUnpaidOrder.allocatedPayment)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-bold">Còn thiếu (Chưa trả nợ):</span>
                    <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm">
                      {formatNumber(debtCheck.earliestUnpaidOrder.remainingDebt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bảng chi tiết mặt hàng (BỎ ĐVT, BỎ Đ, GIAO DIỆN THOÁNG GỌN, PHÂN QUYỀN TỪNG CỘT) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package size={14} className="text-primary" />
              Chi tiết mặt hàng ({order.items.length} loại)
            </h3>
            {itemRights.columns.quantity && (
              <span className="text-xs font-bold text-primary font-mono">
                Tổng SL: {formatNumber(totalQuantity)}
              </span>
            )}
          </div>

          {!itemRights.actions.view ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <Lock size={20} className="mx-auto text-muted-foreground/60 mb-2" />
              <div className="font-semibold text-xs text-foreground">Bạn không có quyền xem chi tiết mặt hàng đơn này</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Vui lòng liên hệ Quản trị viên để được cấp quyền xem bảng này.</div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-muted/60 text-muted-foreground font-semibold border-b border-border text-[11px] uppercase tracking-wider">
                      {itemRights.columns.stt && <th className="py-2.5 px-1.5 text-center w-8">#</th>}
                      {itemRights.columns.flower && <th className="py-2.5 px-3 min-w-[200px]">Mặt hàng</th>}
                      {itemRights.columns.quantity && <th className="py-2.5 px-2 text-right w-20">Số lượng</th>}
                      {itemRights.columns.costPrice && <th className="py-2.5 px-2 text-right w-24">Giá nhập</th>}
                      {itemRights.columns.unitPrice && <th className="py-2.5 px-2 text-right w-24">Giá bán</th>}
                      {itemRights.columns.importTotal && <th className="py-2.5 px-2 text-right w-24">TT Nhập</th>}
                      {itemRights.columns.amount && <th className="py-2.5 px-2.5 text-right w-28">TT Bán</th>}
                      {itemRights.columns.profit && <th className="py-2.5 px-2.5 text-right w-24">Lợi nhuận</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {order.items.map((item, idx) => {
                      const cost = item.costPrice || 0;
                      const price = item.unitPrice || 0;
                      const itemImportTotal = item.importTotal || cost * item.quantity;
                      const itemAmount = item.amount || price * item.quantity;
                      const itemProfit = item.profit !== undefined ? item.profit : itemAmount - itemImportTotal;

                      return (
                        <tr key={idx} className="hover:bg-muted/15 transition-colors">
                          {itemRights.columns.stt && (
                            <td className="py-1.5 px-1 text-center font-mono text-muted-foreground text-[11px]">{idx + 1}</td>
                          )}
                          {itemRights.columns.flower && (
                            <td className="py-1.5 px-2 font-medium text-foreground">
                              <div>{item.flowerName}</div>
                              <span className="text-[10px] text-muted-foreground font-mono">{item.flowerCode}</span>
                            </td>
                          )}
                          {itemRights.columns.quantity && (
                            <td className="py-1.5 px-1 text-right font-bold text-foreground font-mono">
                              {formatNumber(item.quantity)}
                            </td>
                          )}
                          {itemRights.columns.costPrice && (
                            <td className="py-1.5 px-1 text-right text-muted-foreground font-mono">
                              {formatNumber(cost)}
                            </td>
                          )}
                          {itemRights.columns.unitPrice && (
                            <td className="py-1.5 px-1 text-right font-semibold text-primary font-mono">
                              {formatNumber(price)}
                            </td>
                          )}
                          {itemRights.columns.importTotal && (
                            <td className="py-1.5 px-1.5 text-right text-muted-foreground font-mono">
                              {formatNumber(itemImportTotal)}
                            </td>
                          )}
                          {itemRights.columns.amount && (
                            <td className="py-1.5 px-1.5 text-right font-bold text-foreground font-mono">
                              {formatNumber(itemAmount)}
                            </td>
                          )}
                          {itemRights.columns.profit && (
                            <td className="py-1.5 px-1.5 text-right font-bold font-mono">
                              <span className={itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {itemProfit >= 0 ? '+' : ''}{formatNumber(itemProfit)}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted/40 font-bold border-t border-border text-xs">
                    <tr>
                      {(() => {
                        const countLeading = (itemRights.columns.stt ? 1 : 0) + (itemRights.columns.flower ? 1 : 0);
                        if (countLeading > 0) {
                          return (
                            <td colSpan={countLeading} className="py-2 px-2 text-right text-muted-foreground uppercase text-[11px]">
                              Tổng cộng:
                            </td>
                          );
                        }
                        return null;
                      })()}
                      {itemRights.columns.quantity && (
                        <td className="py-2 px-1 text-right font-mono font-extrabold text-foreground">
                          {formatNumber(totalQuantity)}
                        </td>
                      )}
                      {itemRights.columns.costPrice && <td></td>}
                      {itemRights.columns.unitPrice && <td></td>}
                      {itemRights.columns.importTotal && (
                        <td className="py-2 px-1.5 text-right font-mono text-muted-foreground">
                          {formatNumber(totalCost)}
                        </td>
                      )}
                      {itemRights.columns.amount && (
                        <td className="py-2 px-1.5 text-right font-mono text-primary text-sm font-extrabold">
                          {formatNumber(itemsSubtotal)}
                        </td>
                      )}
                      {itemRights.columns.profit && (
                        <td className="py-2 px-1.5 text-right font-mono text-emerald-600 font-extrabold">
                          +{formatNumber(totalProfit)}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Khối tổng hợp tài chính (Không có ký hiệu đ) */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Coins size={14} className="text-primary" />
              Tổng kết thanh toán & Công nợ
            </span>
            {itemRights.columns.summaryProfitCost && (
              <div className="text-xs text-muted-foreground">
                Tổng vốn nhập: <strong className="font-mono text-foreground">{formatNumber(totalCost)}</strong> • Lợi nhuận: <strong className="font-mono text-emerald-600">+{formatNumber(totalProfit)}</strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Thành tiền hàng</span>
              <span className="text-sm font-bold text-foreground font-mono">{formatNumber(itemsSubtotal)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Cước xe (+)</span>
              <span className="text-sm font-bold text-primary font-mono">+{formatNumber(shippingFee)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block mb-0.5">Trừ hàng (-)</span>
              <span className="text-sm font-bold text-rose-600 font-mono">-{formatNumber(discount)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-[11px] text-primary font-semibold block mb-0.5">Tổng tiền đơn hàng</span>
              <span className="text-base font-extrabold text-primary font-mono">{formatNumber(totalAmount)}</span>
            </div>
          </div>

          {/* Thanh toán & Công nợ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Công nợ cũ:</span>
              <strong
                className={`font-mono text-sm font-bold ${
                  oldDebt > 0
                    ? 'text-amber-600'
                    : oldDebt < 0
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'text-muted-foreground'
                }`}
              >
                {oldDebt < 0 ? `Dư: ${formatNumber(Math.abs(oldDebt))}` : formatNumber(oldDebt)}
              </strong>
            </div>

            <div className="px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary flex items-center gap-2 font-mono font-bold">
              <span className="text-xs uppercase font-extrabold tracking-wider">THANH TOÁN:</span>
              <span className="text-sm font-extrabold">
                {totalPayment < 0 ? `Dư: ${formatNumber(Math.abs(totalPayment))}` : formatNumber(totalPayment)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>

    <HoaDonPrintModal
      isOpen={isPrintModalOpen}
      onClose={() => setIsPrintModalOpen(false)}
      order={order}
    />
  </>
);
}
