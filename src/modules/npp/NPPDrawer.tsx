import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Mail,
  MapPin,
  Percent,
  Phone,
  Receipt,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  normalizeToISODate,
  useDebtStore,
  useDistributorStore,
  useOrderStore,
} from '@/stores/hoaKhangThanhStore';
import type { Distributor, Order } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';
import { getDaysDifference } from '@/lib/debtCheck';
import { DonHangDetailModal } from '../don-hang/DonHangDetailModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  distributor?: Distributor | null;
  mode?: 'create' | 'edit' | 'view';
}

const TIERS: Distributor['tier'][] = ['VIP 1 (Kim Cương)', 'VIP 2 (Vàng)', 'VIP 3 (Bạc)', 'Tiềm năng'];
const REGIONS = ['TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Đà Nẵng', 'Cần Thơ', 'Hà Nội', 'Khác'];

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const ORDER_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  nhap: { label: 'Nháp', cls: 'bg-muted text-muted-foreground border-border' },
  da_xac_nhan: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  dang_giao: { label: 'Đang giao', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  hoan_thanh: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' },
  huy: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' },
  pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  processing: { label: 'Đang chuẩn bị', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  delivering: { label: 'Đang giao', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  completed: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' },
  cancelled: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' },
};

export function NPPDrawer({ isOpen, onClose, distributor, mode = 'create' }: Props) {
  const { addDistributor, updateDistributor, distributors } = useDistributorStore();
  const { orders } = useOrderStore();
  const { records } = useDebtStore();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [representative, setRepresentative] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [tier, setTier] = useState<Distributor['tier']>(TIERS[1]);
  const [discount, setDiscount] = useState(8);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [oldDebt, setOldDebt] = useState(0);
  const [salesAmount, setSalesAmount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [status, setStatus] = useState<Distributor['status']>('active');

  // Sub-tabs in view mode: 'orders' | 'debt' | 'info'
  const [viewTab, setViewTab] = useState<'orders' | 'debt' | 'info'>('orders');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const isView = mode === 'view';
  const finalDebt = (oldDebt || 0) + (salesAmount || 0) - (collectedAmount || 0);

  // Get orders of this NPP from useOrderStore
  const nppOrders = useMemo(() => {
    if (!distributor) return [];
    return orders.filter((o) => {
      const matchId = o.distributorId === distributor.id;
      const matchName =
        o.distributorName &&
        (o.distributorName.toLowerCase() === distributor.name.toLowerCase() ||
          distributor.name.toLowerCase().includes(o.distributorName.toLowerCase()) ||
          o.distributorName.toLowerCase().includes(distributor.name.toLowerCase()));
      const matchPhone =
        o.phone &&
        distributor.phone &&
        o.phone.replace(/\s+/g, '') === distributor.phone.replace(/\s+/g, '');
      return matchId || matchName || matchPhone;
    });
  }, [orders, distributor]);

  // Orders summary
  const ordersSummary = useMemo(() => {
    const totalQty = nppOrders.reduce((s, o) => s + (o.totalQuantity || o.items.reduce((sum, i) => sum + (i.quantity || 0), 0)), 0);
    const totalAmount = nppOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalPaid = nppOrders.reduce((s, o) => s + (o.paidAmount || 0), 0);
    const totalDebt = nppOrders.reduce((s, o) => s + Math.max(0, (o.totalAmount || 0) - (o.paidAmount || 0)), 0);
    return { totalQty, totalAmount, totalPaid, totalDebt };
  }, [nppOrders]);

  // Thông tin đơn hàng gần nhất & kiểm tra quá 3 ngày chưa nhập thêm hoa
  const latestOrderInfo = useMemo(() => {
    if (nppOrders.length === 0) return null;
    const validOrders = nppOrders.filter((o) => o.status !== 'huy' && o.status !== 'cancelled');
    const targetOrders = validOrders.length > 0 ? validOrders : nppOrders;
    if (targetOrders.length === 0) return null;

    const sorted = [...targetOrders].sort((a, b) => {
      const dateA = normalizeToISODate(a.orderDate);
      const dateB = normalizeToISODate(b.orderDate);
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.code || b.id).localeCompare(a.code || a.id);
    });

    const latest = sorted[0];
    const days = Math.max(0, getDaysDifference(latest.orderDate));
    return {
      order: latest,
      daysAgo: days,
      isOverdue: days > 3,
    };
  }, [nppOrders]);

  // Tính toán lũy kế công nợ (Running Balance) chuẩn xác theo trình tự thời gian từ cũ đến mới
  const computedDebtRecords = useMemo(() => {
    if (!distributor) return [];

    // 1. Lọc tất cả bản ghi công nợ của NPP này
    const matching = records.filter(
      (r) =>
        r.partnerType === 'npp' &&
        (r.partnerId === distributor.id ||
          r.partnerCode === distributor.code ||
          (r.partnerName && r.partnerName.trim().toLowerCase() === distributor.name.trim().toLowerCase())),
    );

    if (matching.length === 0) return [];

    // 2. Sắp xếp theo dòng thời gian từ CŨ NHẤT đến MỚI NHẤT
    const chronological = [...matching].sort((a, b) => {
      const dateA = normalizeToISODate(a.date);
      const dateB = normalizeToISODate(b.date);
      const dc = dateA.localeCompare(dateB);
      if (dc !== 0) return dc;
      // Cùng ngày: Chi (Bán hoa nợ) trước, Thu (Trả nợ) sau
      const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
      const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
      if (!aIsThu && bIsThu) return -1;
      if (aIsThu && !bIsThu) return 1;
      return (a.id || '').localeCompare(b.id || '');
    });

    // 3. Lũy kế số dư nợ qua từng ngày (Cột ảo Running Balance)
    // Khởi điểm từ Công nợ cũ ban đầu của NPP
    let running = distributor.oldDebt || 0;

    const rowsWithRunningBalance = chronological.map((r) => {
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const increaseAmt = r.increaseAmount !== undefined ? r.increaseAmount : (!isThu ? (r.amount || 0) : 0);
      const decreaseAmt = r.decreaseAmount !== undefined ? r.decreaseAmount : (isThu ? (r.amount || 0) : 0);

      const oldDebtVal = running;
      const finalDebtVal = oldDebtVal + increaseAmt - decreaseAmt;
      running = finalDebtVal;

      return {
        ...r,
        oldDebt: oldDebtVal,
        increaseAmount: increaseAmt,
        decreaseAmount: decreaseAmt,
        finalDebt: finalDebtVal,
        remainingDebt: finalDebtVal,
      };
    });

    // 4. Sắp xếp hiển thị trên bảng: MỚI NHẤT Ở TRÊN ĐẦU
    return rowsWithRunningBalance.sort((a, b) => {
      const dateA = normalizeToISODate(a.date);
      const dateB = normalizeToISODate(b.date);
      const dc = dateB.localeCompare(dateA);
      if (dc !== 0) return dc;
      const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
      const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
      if (aIsThu && !bIsThu) return -1;
      if (!aIsThu && bIsThu) return 1;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [records, distributor]);

  // Tổng hợp số liệu công nợ đối soát chuẩn xác
  const debtSummary = useMemo(() => {
    const totalSales = computedDebtRecords.reduce((s, r) => s + (r.increaseAmount || 0), 0);
    const totalCollected = computedDebtRecords.reduce((s, r) => s + (r.decreaseAmount || 0), 0);
    const initialOldDebt = distributor?.oldDebt || 0;
    const finalCumulativeDebt = initialOldDebt + totalSales - totalCollected;
    return {
      initialOldDebt,
      totalSales,
      totalCollected,
      finalCumulativeDebt,
    };
  }, [computedDebtRecords, distributor]);

  useEffect(() => {
    if (distributor) {
      setCode(distributor.code);
      setName(distributor.name);
      setRepresentative(distributor.representative);
      setPhone(distributor.phone);
      setEmail(distributor.email);
      setAddress(distributor.address);
      setRegion(distributor.region);
      setTier(distributor.tier);
      setDiscount(distributor.discount);
      setTotalRevenue(distributor.totalRevenue);
      setOldDebt(distributor.oldDebt || 0);
      setSalesAmount(distributor.salesAmount || 0);
      setCollectedAmount(distributor.collectedAmount || 0);
      setStatus(distributor.status);
    } else {
      const nextNum = distributors.length + 1;
      setCode(`NPP-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setRepresentative('');
      setPhone('');
      setEmail('');
      setAddress('');
      setRegion(REGIONS[0]);
      setTier(TIERS[1]);
      setDiscount(8);
      setTotalRevenue(0);
      setOldDebt(0);
      setSalesAmount(0);
      setCollectedAmount(0);
      setStatus('active');
    }
  }, [distributor, isOpen, distributors.length, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (distributor && mode === 'edit') {
      updateDistributor(distributor.id, {
        code,
        name,
        representative,
        phone,
        email,
        address,
        region,
        tier,
        discount,
        totalRevenue,
        oldDebt,
        salesAmount,
        collectedAmount,
        finalDebt,
        currentDebt: finalDebt,
        status,
      });
      toast.success(`Đã cập nhật nhà phân phối ${name}`);
    } else {
      addDistributor({
        code,
        name,
        representative,
        phone,
        email,
        address,
        region,
        tier,
        discount,
        totalRevenue,
        oldDebt,
        salesAmount,
        collectedAmount,
        finalDebt,
        currentDebt: finalDebt,
        status,
      });
      toast.success(`Đã thêm nhà phân phối ${name}`);
    }
    onClose();
  };

  return (
    <>
      <Drawer
      title={
        isView ? (
          <div className="flex items-center gap-2">
            <Store className="text-primary shrink-0" size={20} />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">
                Chi tiết Nhà Phân Phối: {distributor?.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Mã: {distributor?.code} • {distributor?.region} • Cấp: {distributor?.tier}
              </p>
            </div>
          </div>
        ) : distributor ? (
          'Chỉnh sửa Nhà phân phối'
        ) : (
          'Thêm Nhà phân phối mới'
        )
      }
      size={isView ? 'lg' : 'md'}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs">
            {isView ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {!isView && (
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground text-xs"
            >
              {distributor ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          )}
        </div>
      }
    >
      {isView && distributor ? (
        <div className="space-y-4">
          {/* Top Banner: Profile & 4 Financial Stats */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                  {distributor.code}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {distributor.tier}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Chiết khấu: <strong className="text-primary">{distributor.discount}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <a
                  href={`tel:${distributor.phone}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Phone size={13} /> {distributor.phone}
                </a>
                <span className="text-muted-foreground flex items-center gap-1">
                  Đại diện: <strong className="text-foreground">{distributor.representative}</strong>
                </span>
              </div>
            </div>

            {/* Cảnh báo tình trạng lên đơn gần nhất */}
            {latestOrderInfo ? (
              latestOrderInfo.isOverdue ? (
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                      <span>Cảnh báo: Đã {latestOrderInfo.daysAgo} ngày chưa lên đơn mới</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                        Quá hạn 3 ngày
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-700/90 dark:text-rose-300/90">
                      Đơn gần nhất được tạo vào ngày <strong>{formatDate(normalizeToISODate(latestOrderInfo.order.orderDate))}</strong> ({latestOrderInfo.order.code}). NPP này chưa nhập thêm hoa trong hơn 3 ngày qua.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={13} className="text-primary shrink-0" />
                    <span>
                      Đơn hàng gần nhất: <strong className="text-foreground">{latestOrderInfo.daysAgo === 0 ? 'Hôm nay' : `${latestOrderInfo.daysAgo} ngày trước`}</strong> ({formatDate(normalizeToISODate(latestOrderInfo.order.orderDate))} • {latestOrderInfo.order.code})
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    Đã đặt trong 3 ngày
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground">
                <Clock size={13} className="shrink-0" />
                <span>NPP này chưa có đơn hàng nào được ghi nhận trong hệ thống.</span>
              </div>
            )}

            {/* 4 Chỉ số công nợ đối soát */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Công nợ cũ
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {debtSummary.initialOldDebt < 0
                    ? `Dư: ${formatNumber(Math.abs(debtSummary.initialOldDebt))}`
                    : formatNumber(debtSummary.initialOldDebt)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                  Tiền bán hoa (+)
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {formatNumber(debtSummary.totalSales)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <span className="text-[10px] text-emerald-600 block uppercase font-semibold">
                  Tiền thu nợ (-)
                </span>
                <span className="text-sm font-mono font-bold text-emerald-600">
                  {formatNumber(debtSummary.totalCollected)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                <span className="text-[10px] text-primary block uppercase font-bold">
                  Công nợ cuối (Lũy kế)
                </span>
                <span
                  className={`text-sm font-mono font-extrabold ${
                    debtSummary.finalCumulativeDebt > 0
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {debtSummary.finalCumulativeDebt < 0
                    ? `Dư: ${formatNumber(Math.abs(debtSummary.finalCumulativeDebt))}`
                    : formatNumber(debtSummary.finalCumulativeDebt)}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-tabs inside Drawer */}
          <div className="flex items-center gap-1 border-b border-border pb-1">
            <button
              type="button"
              onClick={() => setViewTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ShoppingCart size={14} />
              Đơn hàng mua ({nppOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('debt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'debt'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Receipt size={14} />
              Công nợ theo ngày ({computedDebtRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('info')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewTab === 'info'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Info size={14} />
              Thông tin liên hệ
            </button>
          </div>

          {/* TAB 1: BẢNG ĐƠN HÀNG MUA CỦA NPP (LẤY TỪ MODUL ĐƠN HÀNG) */}
          {viewTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <ShoppingCart size={15} className="text-primary" />
                  Danh sách đơn hàng hoa tươi đã đặt
                </span>
                <span className="text-muted-foreground font-mono">
                  Tổng {nppOrders.length} đơn hàng • {formatNumber(ordersSummary.totalQty)} cành/bó
                </span>
              </div>

              {nppOrders.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  <ShoppingCart size={28} className="mx-auto mb-2 opacity-40" />
                  Chưa có đơn hàng nào được ghi nhận cho nhà phân phối này trong module Đơn hàng.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs text-left border-collapse min-w-[550px]">
                    <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Ngày</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Số lượng</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Tổng tiền</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {nppOrders.map((o) => {
                        const statusObj = ORDER_STATUS_LABELS[o.status] || {
                          label: o.status,
                          cls: 'bg-muted text-muted-foreground',
                        };
                        const totalQty =
                          o.totalQuantity || o.items.reduce((s, i) => s + (i.quantity || 0), 0);

                        return (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-foreground">
                                {formatDate(normalizeToISODate(o.orderDate))}
                              </div>
                              <button
                                type="button"
                                onClick={() => setViewingOrder(o)}
                                className="font-mono text-[11px] text-primary hover:underline font-bold block text-left"
                                title="Xem chi tiết đơn hàng"
                              >
                                {o.code}
                              </button>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-center text-foreground">
                              {formatNumber(totalQty)}
                            </td>
                            <td className="py-2 px-3 font-mono font-extrabold text-foreground text-right">
                              {formatNumber(o.totalAmount)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.cls}`}
                              >
                                {statusObj.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t border-border text-foreground">
                      <tr>
                        <td className="py-2 px-3 text-left">
                          Tổng cộng ({nppOrders.length} đơn):
                        </td>
                        <td className="py-2 px-3 font-mono text-center font-bold">
                          {formatNumber(ordersSummary.totalQty)}
                        </td>
                        <td className="py-2 px-3 font-mono text-right font-extrabold text-foreground">
                          {formatNumber(ordersSummary.totalAmount)}
                        </td>
                        <td className="py-2 px-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BẢNG CÔNG NỢ THEO NGÀY CỦA NPP (LẤY TỪ MODUL CÔNG NỢ) */}
          {viewTab === 'debt' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Receipt size={15} className="text-primary" />
                  Sổ chi tiết phát sinh công nợ theo ngày
                </span>
                <span className="text-muted-foreground font-mono">
                  {computedDebtRecords.length} ngày phát sinh ghi nhận
                </span>
              </div>

              {computedDebtRecords.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  <Receipt size={28} className="mx-auto mb-2 opacity-40" />
                  Chưa có bản ghi công nợ theo ngày nào cho NPP này trong module Công nợ.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                    <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">Ngày (dd/mm/yyyy)</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Chứng từ / ĐH</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Công nợ cũ</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Tiền bán hoa (+)</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Tiền thu nợ (-)</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Công nợ cuối</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Diễn giải / Ghi chú</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Người lập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {computedDebtRecords.map((r) => {
                        return (
                          <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                              {formatDate(normalizeToISODate(r.date))}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                              {r.referenceCode || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-right whitespace-nowrap">
                              {r.oldDebt < 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Dư: {formatNumber(Math.abs(r.oldDebt))}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-medium">
                                  {formatNumber(r.oldDebt)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground text-right whitespace-nowrap">
                              {formatNumber(r.increaseAmount)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">
                              {formatNumber(r.decreaseAmount)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-extrabold text-right whitespace-nowrap">
                              {r.finalDebt < 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Dư: {formatNumber(Math.abs(r.finalDebt))}
                                </span>
                              ) : (
                                <span
                                  className={
                                    r.finalDebt > 0
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  {formatNumber(r.finalDebt)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 max-w-[240px] truncate" title={r.notes}>
                              <span className="text-muted-foreground">{r.notes || '—'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-xs whitespace-nowrap">
                              {r.creator || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/40 font-bold border-t border-border text-foreground">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-left whitespace-nowrap">
                          Tổng cộng ({computedDebtRecords.length} ngày):
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-muted-foreground whitespace-nowrap">
                          {debtSummary.initialOldDebt < 0
                            ? `Dư: ${formatNumber(Math.abs(debtSummary.initialOldDebt))}`
                            : formatNumber(debtSummary.initialOldDebt)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground text-right whitespace-nowrap">
                          {formatNumber(debtSummary.totalSales)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">
                          {formatNumber(debtSummary.totalCollected)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-right whitespace-nowrap">
                          <span
                            className={
                              debtSummary.finalCumulativeDebt > 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {debtSummary.finalCumulativeDebt < 0
                              ? `Dư: ${formatNumber(Math.abs(debtSummary.finalCumulativeDebt))}`
                              : formatNumber(debtSummary.finalCumulativeDebt)}
                          </span>
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: THÔNG TIN CHI TIẾT */}
          {viewTab === 'info' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Người đại diện:</span>
                <span className="font-semibold text-foreground">{distributor.representative}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Số điện thoại:</span>
                <a
                  href={`tel:${distributor.phone}`}
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Phone size={13} /> {distributor.phone}
                </a>
              </div>
              {distributor.email && (
                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Mail size={13} /> {distributor.email}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Địa chỉ nhận hoa:</span>
                <span className="font-semibold text-foreground flex items-center gap-1 text-right max-w-[280px]">
                  <MapPin size={13} className="shrink-0" /> {distributor.address}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Khu vực phân phối:</span>
                <span className="font-semibold text-foreground">{distributor.region}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Cấp đại lý:</span>
                <span className="font-bold text-amber-600">{distributor.tier}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Mức chiết khấu sỉ:</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Percent size={13} /> {distributor.discount}%
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Tổng doanh số tích lũy:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatNumber(distributor.totalRevenue || 0)}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái hợp tác:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    distributor.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {distributor.status === 'active' ? 'Đang hợp tác' : 'Tạm ngưng'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Create & Edit Mode Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mã NPP
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Cấp đại lý</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as Distributor['tier'])}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên Nhà phân phối / Shop hoa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chuỗi Shop Hoa Tươi FlowerBox"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Người đại diện
              </label>
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="VD: Đặng Thu Hương"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0903 112 233"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="huong.flowerbox@gmail.com"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Khu vực</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Địa chỉ giao nhận
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="128 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Chiết khấu sỉ (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Distributor['status'])}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="active">Đang hợp tác</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {/* 4 Cột tài chính NPP */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide block">
              Thông tin Công nợ đối soát
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  1. Công nợ cũ
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={oldDebt === 0 ? '' : oldDebt}
                  onChange={(e) => setOldDebt(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  2. Tiền bán hoa (+)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={salesAmount === 0 ? '' : salesAmount}
                  onChange={(e) => setSalesAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-600 mb-1">
                  3. Tiền thu nợ (-)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={collectedAmount === 0 ? '' : collectedAmount}
                  onChange={(e) => setCollectedAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">
                  4. Công nợ cuối (Lũy kế)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  = Công nợ cũ + Tiền bán hoa - Tiền thu nợ
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-base font-extrabold font-mono ${
                    finalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {formatNumber(finalDebt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {finalDebt > 0 ? 'Còn phải thu' : 'Đã thanh toán đủ'}
                </span>
              </div>
            </div>
          </div>
        </form>
      )}
    </Drawer>
    {viewingOrder && (
      <DonHangDetailModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    )}
  </>
  );
}
