import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Flower2,
  Search,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  BarChartBox,
  ChartCard,
  StatCard,
  useChartReady,
} from '@/components/data/StatsKit';
import { Button } from '@/components/ui/Button';
import { useSupplierOrderStore, useSupplierStore } from '@/stores/hoaKhangThanhStore';
import { formatDate, todayISODate } from '@/lib/format';
import type { SupplierOrder } from '@/types/hoaKhangThanh';

type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom';
type ViewMode = 'aggregated' | 'detailed';

interface AggregatedFlowerRow {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  customName: string;
  totalQuantity: number;
  totalAmount: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  orderCount: number;
  percentage: number;
}

interface DetailedImportRow {
  orderId: string;
  orderCode: string;
  orderDate: string;
  supplierName: string;
  flowerCode: string;
  flowerName: string;
  customName: string;
  quantity: number;
  costPrice: number;
  amount: number;
  orderStatus: SupplierOrder['status'];
}

export function DonHangNCCStats() {
  const { orders } = useSupplierOrderStore();
  const { suppliers } = useSupplierStore();
  const ready = useChartReady();

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('aggregated');

  // Pagination for the report table
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  // Date range determination
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    const today = new Date();
    const todayStr = todayISODate();

    if (datePreset === 'all') {
      return { effectiveStart: '', effectiveEnd: '' };
    }
    if (datePreset === 'today') {
      return { effectiveStart: todayStr, effectiveEnd: todayStr };
    }
    if (datePreset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { effectiveStart: yStr, effectiveEnd: yStr };
    }
    if (datePreset === '7days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { effectiveStart: d.toISOString().split('T')[0], effectiveEnd: todayStr };
    }
    if (datePreset === 'month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const start = `${year}-${month}-01`;
      return { effectiveStart: start, effectiveEnd: todayStr };
    }
    // custom
    return { effectiveStart: startDate, effectiveEnd: endDate };
  }, [datePreset, startDate, endDate]);

  // Filter orders by date & supplier
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (effectiveStart && o.orderDate < effectiveStart) return false;
      if (effectiveEnd && o.orderDate > effectiveEnd) return false;
      if (selectedSupplier !== 'all' && o.supplierName !== selectedSupplier) return false;
      return true;
    });
  }, [orders, effectiveStart, effectiveEnd, selectedSupplier]);

  // Overall statistics
  const summary = useMemo(() => {
    let totalQty = 0;
    let totalImportAmount = 0;
    let totalShipping = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalDebt = 0;

    filteredOrders.forEach((o) => {
      const qty = o.totalQuantity || o.items.reduce((s, i) => s + i.quantity, 0);
      const subtotal = o.itemsSubtotal || o.items.reduce((s, i) => s + i.amount, 0);
      const ship = o.shippingFee || 0;
      const disc = o.discount || 0;
      const grandTotal = o.totalAmount || Math.max(0, subtotal + ship - disc);
      const paid = o.paidAmount || 0;
      const debt = o.debtAmount !== undefined ? o.debtAmount : Math.max(0, grandTotal - paid);

      totalQty += qty;
      totalImportAmount += grandTotal;
      totalShipping += ship;
      totalDiscount += disc;
      totalPaid += paid;
      totalDebt += debt;
    });

    return {
      orderCount: filteredOrders.length,
      totalQty,
      totalImportAmount,
      totalShipping,
      totalDiscount,
      totalPaid,
      totalDebt,
    };
  }, [filteredOrders]);

  // Detailed flower import rows
  const detailedRows = useMemo<DetailedImportRow[]>(() => {
    const rows: DetailedImportRow[] = [];
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const row: DetailedImportRow = {
          orderId: order.id,
          orderCode: order.code,
          orderDate: order.orderDate,
          supplierName: order.supplierName,
          flowerCode: item.flowerCode || '',
          flowerName: item.flowerName,
          customName: item.customName || '',
          quantity: item.quantity,
          costPrice: item.costPrice,
          amount: item.amount,
          orderStatus: order.status,
        };

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const match =
            row.flowerName.toLowerCase().includes(q) ||
            row.customName.toLowerCase().includes(q) ||
            row.flowerCode.toLowerCase().includes(q) ||
            row.orderCode.toLowerCase().includes(q) ||
            row.supplierName.toLowerCase().includes(q);
          if (match) rows.push(row);
        } else {
          rows.push(row);
        }
      });
    });

    return rows.sort((a, b) => (b.orderDate > a.orderDate ? 1 : -1));
  }, [filteredOrders, searchTerm]);

  // Aggregated flower statistics
  const aggregatedRows = useMemo<AggregatedFlowerRow[]>(() => {
    const map = new Map<
      string,
      {
        flowerId: string;
        flowerCode: string;
        flowerName: string;
        customName: string;
        totalQuantity: number;
        totalAmount: number;
        prices: number[];
        orderCount: number;
      }
    >();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.flowerId || item.flowerName.trim().toLowerCase();
        const current = map.get(key) || {
          flowerId: item.flowerId || '',
          flowerCode: item.flowerCode || '',
          flowerName: item.flowerName,
          customName: item.customName || '',
          totalQuantity: 0,
          totalAmount: 0,
          prices: [],
          orderCount: 0,
        };

        current.totalQuantity += item.quantity || 0;
        current.totalAmount += item.amount || 0;
        if (item.costPrice > 0) current.prices.push(item.costPrice);
        current.orderCount += 1;

        map.set(key, current);
      });
    });

    const totalAllQty = Array.from(map.values()).reduce((sum, r) => sum + r.totalQuantity, 0);

    const list: AggregatedFlowerRow[] = Array.from(map.values()).map((r) => {
      const avg = r.totalQuantity > 0 ? Math.round(r.totalAmount / r.totalQuantity) : 0;
      const min = r.prices.length > 0 ? Math.min(...r.prices) : 0;
      const max = r.prices.length > 0 ? Math.max(...r.prices) : 0;
      const pct = totalAllQty > 0 ? (r.totalQuantity / totalAllQty) * 100 : 0;

      return {
        flowerId: r.flowerId,
        flowerCode: r.flowerCode,
        flowerName: r.flowerName,
        customName: r.customName,
        totalQuantity: r.totalQuantity,
        totalAmount: r.totalAmount,
        averagePrice: avg,
        minPrice: min,
        maxPrice: max,
        orderCount: r.orderCount,
        percentage: Number(pct.toFixed(1)),
      };
    });

    const filtered = searchTerm
      ? list.filter((r) => {
          const q = searchTerm.toLowerCase();
          return (
            r.flowerName.toLowerCase().includes(q) ||
            r.customName.toLowerCase().includes(q) ||
            r.flowerCode.toLowerCase().includes(q)
          );
        })
      : list;

    return filtered.sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredOrders, searchTerm]);

  // Chart data for Top Flowers by Quantity
  const chartDataQuantity = useMemo(() => {
    return aggregatedRows.slice(0, 7).map((item) => ({
      name: item.flowerName.length > 15 ? `${item.flowerName.slice(0, 15)}...` : item.flowerName,
      value: item.totalQuantity,
    }));
  }, [aggregatedRows]);

  // Chart data for Top Flowers by Amount
  const chartDataAmount = useMemo(() => {
    return [...aggregatedRows]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 7)
      .map((item) => ({
        name: item.flowerName.length > 15 ? `${item.flowerName.slice(0, 15)}...` : item.flowerName,
        value: Math.round(item.totalAmount / 1000), // in k for better chart display
      }));
  }, [aggregatedRows]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng hợp loại hoa
      const summaryData = aggregatedRows.map((r, idx) => ({
        STT: idx + 1,
        'Mã hoa': r.flowerCode || '-',
        'Tên hoa': r.flowerName,
        'Tên riêng': r.customName || '-',
        'Số lượng nhập': r.totalQuantity,
        'Giá nhập TB': r.averagePrice,
        'Giá thấp nhất': r.minPrice,
        'Giá cao nhất': r.maxPrice,
        'Tổng tiền nhập': r.totalAmount,
        'Tỷ trọng (%)': `${r.percentage}%`,
        'Số lần nhập': r.orderCount,
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng hợp hoa nhập');

      // Sheet 2: Chi tiết theo từng đơn nhập
      const detailData = detailedRows.map((r, idx) => ({
        STT: idx + 1,
        'Mã đơn': r.orderCode,
        'Ngày đặt': formatDate(r.orderDate),
        'Nhà cung cấp': r.supplierName,
        'Mã hoa': r.flowerCode || '-',
        'Tên hoa': r.flowerName,
        'Tên riêng': r.customName || '-',
        'Số lượng': r.quantity,
        'Giá nhập': r.costPrice,
        'Thành tiền': r.amount,
      }));
      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi tiết đơn nhập');

      const fileName = `Bao_Cao_Hoa_Nhap_NCC_${effectiveStart || 'all'}_den_${
        effectiveEnd || 'all'
      }.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Đã xuất file Excel báo cáo hoa nhập thành công!');
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Paginated Rows
  const totalItems = viewMode === 'aggregated' ? aggregatedRows.length : detailedRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return viewMode === 'aggregated'
      ? aggregatedRows.slice(start, start + pageSize)
      : detailedRows.slice(start, start + pageSize);
  }, [viewMode, aggregatedRows, detailedRows, page, pageSize]);

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* HEADER & FILTER TOOLBAR */}
      <div className="bg-card border border-border/80 rounded-xl p-3 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShoppingCart size={16} className="text-primary" />
              Báo cáo & Thống kê Đơn nhập hoa Nhà cung cấp
            </h2>
            <p className="text-xs text-muted-foreground">
              Phân tích khối lượng hoa nhập từ các nhà vườn, đơn giá nhập và theo dõi công nợ NCC
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 text-xs gap-1.5 font-medium border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Download size={14} />
              <span>Xuất Excel</span>
            </Button>
          </div>
        </div>

        {/* BỘ LỌC THỜI GIAN & NHÀ VƯỜN */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/80">
            {(
              [
                ['all', 'Tất cả'],
                ['today', 'Hôm nay'],
                ['yesterday', 'Hôm qua'],
                ['7days', '7 ngày qua'],
                ['month', 'Tháng này'],
                ['custom', 'Tùy chọn'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDatePreset(key);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  datePreset === key
                    ? 'bg-background text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground"
              />
              <span className="text-xs text-muted-foreground">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 px-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground"
              />
            </div>
          )}

          {/* Supplier dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Users size={14} className="text-muted-foreground" />
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary max-w-xs"
            >
              <option value="all">Tất cả Nhà cung cấp ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* THẺ TỔNG HỢP NHANH (STAT CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Tổng đơn nhập"
          value={formatNumber(summary.orderCount)}
          icon={ShoppingCart}
          primary
        />
        <StatCard
          label="Tổng hoa nhập"
          value={formatNumber(summary.totalQty)}
          icon={Flower2}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
        <StatCard
          label="Tổng tiền nhập"
          value={formatNumber(summary.totalImportAmount)}
          icon={TrendingUp}
          colorClass="bg-purple-500/10 text-purple-600 border-purple-200"
        />
        <StatCard
          label="Cước xe nhà vườn"
          value={formatNumber(summary.totalShipping)}
          icon={Truck}
          colorClass="bg-amber-500/10 text-amber-600 border-amber-200"
        />
        <StatCard
          label="Đã trả NCC"
          value={formatNumber(summary.totalPaid)}
          icon={CheckCircle2}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Còn nợ NCC"
          value={formatNumber(summary.totalDebt)}
          icon={Clock}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
      </div>

      {/* BIỂU ĐỒ TRỰC QUAN */}
      {ready && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard
            title="Top 7 hoa nhập nhiều nhất theo số lượng (bó / cành)"
            icon={<Flower2 size={16} className="text-primary" />}
          >
            <div className="h-64">
              <BarChartBox
                data={chartDataQuantity}
                seriesName="Số lượng hoa nhập"
              />
            </div>
          </ChartCard>

          <ChartCard
            title="Top 7 hoa nhập có giá trị lớn nhất (x 1.000)"
            icon={<TrendingUp size={16} className="text-primary" />}
          >
            <div className="h-64">
              <BarChartBox
                data={chartDataAmount}
                seriesName="Thành tiền nhập"
              />
            </div>
          </ChartCard>
        </div>
      )}

      {/* DANH SÁCH HOA NHẬP LỌC THEO NGÀY */}
      <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-3 bg-muted/40 border-b border-border/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Flower2 size={15} className="text-primary" />
              Bảng danh sách hoa mua từ NCC
            </span>
            <div className="flex items-center gap-1 bg-background border border-border/80 rounded-lg p-0.5 ml-2">
              <button
                type="button"
                onClick={() => {
                  setViewMode('aggregated');
                  setPage(1);
                }}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  viewMode === 'aggregated'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tổng hợp theo loại hoa ({aggregatedRows.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('detailed');
                  setPage(1);
                }}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chi tiết từng đơn nhập ({detailedRows.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm hoa, mã hoa, đơn..."
                className="h-8 pl-8 pr-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary w-48"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {viewMode === 'aggregated' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Mã hoa</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Tên mặt hàng hoa</th>
                  <th className="py-2.5 px-3">Tên riêng</th>
                  <th className="py-2.5 px-3 text-right">Số lượng nhập</th>
                  <th className="py-2.5 px-3 text-right">Giá nhập TB</th>
                  <th className="py-2.5 px-3 text-right">Thấp nhất</th>
                  <th className="py-2.5 px-3 text-right">Cao nhất</th>
                  <th className="py-2.5 px-3 text-right font-bold text-foreground">Tổng tiền nhập</th>
                  <th className="py-2.5 px-3 text-right">Tỷ trọng</th>
                  <th className="py-2.5 px-3 text-center">Số lần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(currentRows as AggregatedFlowerRow[]).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                      {row.flowerCode || '-'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-foreground">{row.flowerName}</td>
                    <td className="py-2 px-3 text-muted-foreground">{row.customName || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      {formatNumber(row.totalQuantity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {formatNumber(row.averagePrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {formatNumber(row.minPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {formatNumber(row.maxPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                      {formatNumber(row.totalAmount)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {row.percentage}%
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                      {row.orderCount}
                    </td>
                  </tr>
                ))}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      Không có dữ liệu hoa nhập phù hợp với bộ lọc đã chọn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground text-[11px]">
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Ngày đặt</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Nhà cung cấp</th>
                  <th className="py-2.5 px-3">Mã hoa</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Tên hoa</th>
                  <th className="py-2.5 px-3 text-right">Số lượng</th>
                  <th className="py-2.5 px-3 text-right">Giá nhập</th>
                  <th className="py-2.5 px-3 text-right font-bold text-foreground">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(currentRows as DetailedImportRow[]).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-primary text-[11px]">
                      {row.orderCode}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">
                      {formatDate(row.orderDate)}
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground">{row.supplierName}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                      {row.flowerCode || '-'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-foreground">
                      {row.flowerName}
                      {row.customName && row.customName !== row.flowerName && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({row.customName})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      {formatNumber(row.quantity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {formatNumber(row.costPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                      {formatNumber(row.amount)}
                    </td>
                  </tr>
                ))}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      Không có chi tiết hoa nhập phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalItems > pageSize && (
          <div className="p-3 bg-muted/20 border-t border-border/80 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Hiển thị {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, totalItems)} trong {totalItems} dòng
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 text-xs"
              >
                Trước
              </Button>
              <span className="px-2 text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
