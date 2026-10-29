import {
  Clock,
  Coins,
  Flower2,
  Package,
  Phone,
  Printer,
  ShoppingCart,
  Truck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useSupplierOrderStore } from '@/stores/hoaKhangThanhStore';
import type { SupplierOrder } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';

interface Props {
  order: SupplierOrder | null;
  onClose: () => void;
  onEdit?: (order: SupplierOrder) => void;
}

export function DonHangNCCDetailModal({ order, onClose, onEdit }: Props) {
  const { updateOrderStatus, updatePaymentStatus } = useSupplierOrderStore();

  if (!order) return null;

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const handleStatusChange = (newStatus: SupplierOrder['status']) => {
    updateOrderStatus(order.id, newStatus);
    toast.success('Đã cập nhật trạng thái đơn đặt hàng NCC');
  };

  const handlePayFull = () => {
    updatePaymentStatus(order.id, 'paid', order.totalAmount);
    toast.success('Đã xác nhận thanh toán đủ tiền cho Nhà cung cấp');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalQuantity =
    order.totalQuantity || order.items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsSubtotal =
    order.itemsSubtotal || order.items.reduce((sum, i) => sum + i.amount, 0);
  const shippingFee = order.shippingFee || 0;
  const discount = order.discount || 0;
  const totalAmount = order.totalAmount || Math.max(0, itemsSubtotal + shippingFee - discount);
  const paidAmount = order.paidAmount || 0;
  const debtAmount =
    order.debtAmount !== undefined ? order.debtAmount : Math.max(0, totalAmount - paidAmount);

  const getStatusBadge = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'nhap':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            Nháp (Chờ gửi NCC)
          </span>
        );
      case 'da_gui_ncc':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-800">
            Đã gửi cho NCC
          </span>
        );
      case 'dang_chuyen':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-800">
            Đang chuyển về kho
          </span>
        );
      case 'da_nhap_kho':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
            Đã nhập kho đủ
          </span>
        );
      case 'huy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-800">
            Đã hủy đơn
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (paymentStatus: SupplierOrder['paymentStatus']) => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            Đã thanh toán đủ
          </span>
        );
      case 'partial':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            Thanh toán 1 phần
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
            Chưa thanh toán
          </span>
        );
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">Chi tiết đơn nhập NCC: {order.code}</span>
          {getStatusBadge(order.status)}
          {getPaymentBadge(order.paymentStatus)}
        </div>
      }
      subtitle={`Ngày đặt: ${formatDate(order.orderDate)} • Người lập: ${order.creator}`}
      icon={<ShoppingCart size={18} className="text-primary" />}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
            >
              <Printer size={14} />
              In phiếu nhập
            </Button>
            {debtAmount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePayFull}
                className="text-xs gap-1.5 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/10"
              >
                <Coins size={14} />
                Thanh toán hết ({formatNumber(debtAmount)})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onEdit(order)}
                className="text-xs"
              >
                Chỉnh sửa đơn
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs pb-4">
        {/* Nhanh chuyển trạng thái */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/30 border border-border/80 rounded-xl">
          <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
            Cập nhật tiến độ đơn hàng:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStatusChange('nhap')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                order.status === 'nhap'
                  ? 'bg-muted text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Nháp
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('da_gui_ncc')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                order.status === 'da_gui_ncc'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Đã gửi NCC
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('dang_chuyen')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                order.status === 'dang_chuyen'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Đang chuyển
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('da_nhap_kho')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                order.status === 'da_nhap_kho'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Đã nhập kho
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('huy')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                order.status === 'huy'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Hủy đơn
            </button>
          </div>
        </div>

        {/* Thông tin nhà cung cấp & Đơn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-card border border-border/80 rounded-xl shadow-sm">
          <div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package size={13} className="text-primary" /> Thông tin Nhà cung cấp / Nhà vườn
            </h4>
            <div className="space-y-1.5">
              <div className="text-sm font-bold text-foreground">{order.supplierName}</div>
              {order.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone size={12} />
                  <span>{order.phone}</span>
                </div>
              )}
              {order.address && (
                <div className="text-muted-foreground">
                  <span>Địa chỉ: </span>
                  <span className="text-foreground">{order.address}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-primary" /> Thông tin giao nhận & Kho
            </h4>
            <div className="space-y-1.5 text-muted-foreground">
              <div>
                Ngày đặt: <strong className="text-foreground">{formatDate(order.orderDate)}</strong>
              </div>
              {order.deliveryDate && (
                <div>
                  Ngày giao dự kiến: <strong className="text-foreground">{formatDate(order.deliveryDate)}</strong>
                </div>
              )}
              {order.warehouse && (
                <div>
                  Kho nhận: <strong className="text-foreground">{order.warehouse}</strong>
                </div>
              )}
              <div className="flex items-center gap-1">
                <User size={12} /> Người lập đơn:{' '}
                <strong className="text-foreground">{order.creator}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng hoa */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm">
          <div className="px-3 py-2 bg-muted/40 border-b border-border/80 flex items-center justify-between">
            <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Flower2 size={14} className="text-primary" /> Danh sách hoa đặt nhập ({order.items.length} loại hoa)
            </span>
            <span className="text-muted-foreground text-[11px]">
              Tổng SL hoa: <strong className="text-foreground font-mono">{formatNumber(totalQuantity)}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground text-[11px]">
                  <th className="py-2 px-3 text-center w-12">STT</th>
                  <th className="py-2 px-3">Mã hoa</th>
                  <th className="py-2 px-3 min-w-[180px]">Tên mặt hàng hoa</th>
                  <th className="py-2 px-3 text-center w-20">ĐVT</th>
                  <th className="py-2 px-3 text-right w-24">Số lượng</th>
                  <th className="py-2 px-3 text-right w-28">Giá nhập</th>
                  <th className="py-2 px-3 text-right w-32">Thành tiền</th>
                  <th className="py-2 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                      {item.flowerCode || '-'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-foreground">{item.flowerName}</div>
                      {item.customName && item.customName !== item.flowerName && (
                        <div className="text-[10px] text-muted-foreground">({item.customName})</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-muted-foreground">{item.unit}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {formatNumber(item.costPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      {formatNumber(item.amount)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổng kết tiền */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/20 border border-border/70 rounded-xl space-y-2">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ghi chú đơn đặt hàng
            </span>
            <p className="text-foreground whitespace-pre-wrap">{order.notes || 'Không có ghi chú.'}</p>
            {order.imageUrl && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground">Ảnh hóa đơn kèm theo:</span>
                <div className="mt-1">
                  <a
                    href={order.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-xs inline-flex items-center gap-1"
                  >
                    Xem ảnh chứng từ gốc
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/30 border border-border/70 rounded-xl space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Thành tiền hoa:</span>
              <span className="font-mono font-bold text-foreground">{formatNumber(itemsSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck size={13} /> Cước xe nhà vườn:
              </span>
              <span className="font-mono font-semibold text-foreground">+{formatNumber(shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Trừ hàng / Bớt giá:</span>
              <span className="font-mono font-semibold text-rose-600">-{formatNumber(discount)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/70 bg-primary/5 px-2 rounded-lg">
              <span className="font-bold text-foreground">Tổng tiền đơn nhập:</span>
              <span className="font-mono font-bold text-primary text-base">
                {formatNumber(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-emerald-600">Đã trả NCC:</span>
              <span className="font-mono font-bold text-emerald-600">{formatNumber(paidAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-1 pt-1.5 border-t border-border/60">
              <span className="font-bold text-rose-600">Còn nợ NCC:</span>
              <span className="font-mono font-bold text-rose-600 text-base">
                {formatNumber(debtAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
