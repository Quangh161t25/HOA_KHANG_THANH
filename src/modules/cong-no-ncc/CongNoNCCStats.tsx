import { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Coins,
  Layers,
  Receipt,
  Truck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useAllDebtRecords } from '@/lib/virtualDebt';
import { useSupplierStore, calculateSupplierFinancials, useDebtStore, useSupplierOrderStore } from '@/stores/hoaKhangThanhStore';
import { formatDate } from '@/lib/format';

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const tick = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };
const BAR_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export function CongNoNCCStats() {
  const records = useAllDebtRecords();
  const { suppliers } = useSupplierStore();
  const { records: manualDebtRecords } = useDebtStore();
  const { orders: supplierOrders } = useSupplierOrderStore();
  const ready = useChartReady();

  // Dữ liệu tài chính tính toán chuẩn cho từng NCC
  const enrichedSuppliers = useMemo(() => {
    return suppliers.map((s) => {
      const fin = calculateSupplierFinancials(s, manualDebtRecords, supplierOrders);
      return {
        ...s,
        oldDebt: fin.oldDebt,
        importAmount: fin.importAmount,
        paidAmount: fin.paidAmount,
        finalDebt: fin.finalDebt,
        totalDebt: fin.totalDebt,
      };
    });
  }, [suppliers, manualDebtRecords, supplierOrders]);

  // Lọc riêng bản ghi công nợ NCC
  const nccRecords = useMemo(() => records.filter((r) => r.partnerType === 'ncc'), [records]);

  // Tổng hợp chỉ số tài chính NCC
  const stats = useMemo(() => {
    const totalOldDebt = enrichedSuppliers.reduce((s, sup) => s + (sup.oldDebt || 0), 0);
    const totalImport = enrichedSuppliers.reduce((s, sup) => s + (sup.importAmount || 0), 0);
    const totalPaid = enrichedSuppliers.reduce((s, sup) => s + (sup.paidAmount || 0), 0);
    const totalFinalDebt = enrichedSuppliers.reduce((s, sup) => s + (sup.finalDebt || 0), 0);
    const countWithDebt = enrichedSuppliers.filter((sup) => (sup.finalDebt || 0) > 0).length;

    return {
      totalOldDebt,
      totalImport,
      totalPaid,
      totalFinalDebt,
      countWithDebt,
      totalSuppliers: suppliers.length,
    };
  }, [enrichedSuppliers, suppliers.length]);

  // Biểu đồ biến động theo ngày (Tiền nhập hoa vs Tiền trả NCC)
  const dailyChartData = useMemo(() => {
    const dates = Array.from(new Set(nccRecords.map((r) => r.date))).sort();
    return dates.map((d) => {
      const recs = nccRecords.filter((r) => r.date === d);
      const nccNhap =
        recs
          .filter((r) => r.type === 'chi' || ((r.increaseAmount || 0) > 0 && (r.decreaseAmount || 0) === 0))
          .reduce((s, r) => s + (r.amount !== undefined ? r.amount : (r.increaseAmount || 0)), 0) / 1000000;
      const nccTra =
        recs
          .filter((r) => r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0))
          .reduce((s, r) => s + (r.amount !== undefined ? r.amount : (r.decreaseAmount || 0)), 0) / 1000000;

      return {
        date: formatDate(d),
        'Tiền nhập hoa': Math.round(nccNhap * 10) / 10,
        'Tiền trả NCC': Math.round(nccTra * 10) / 10,
      };
    });
  }, [nccRecords]);

  // Top NCC nợ nhiều nhất
  const topNccDebt = useMemo(() => {
    return enrichedSuppliers
      .filter((s) => (s.finalDebt || 0) > 0)
      .sort((a, b) => (b.finalDebt || 0) - (a.finalDebt || 0))
      .slice(0, 7)
      .map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        finalDebt: s.finalDebt || 0,
        percentage: stats.totalFinalDebt > 0 ? Math.round(((s.finalDebt || 0) / stats.totalFinalDebt) * 100) : 0,
      }));
  }, [enrichedSuppliers, stats.totalFinalDebt]);

  // Biểu đồ Top nợ NCC (cho Recharts)
  const topChartData = useMemo(() => {
    return topNccDebt.map((item) => ({
      name: item.name.length > 18 ? `${item.name.slice(0, 16)}...` : item.name,
      'Dư nợ (Tr.đ)': Math.round((item.finalDebt / 1000000) * 10) / 10,
    }));
  }, [topNccDebt]);

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      {/* Header giới thiệu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <Truck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Báo cáo & Thống kê Công nợ Nhà Cung Cấp (Nhà vườn)
            </h3>
            <p className="text-xs text-muted-foreground">
              Số liệu công nợ đối soát tự động từ các đơn đặt hoa NCC và các phiếu thanh toán tiền vườn
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground self-start sm:self-auto border border-border">
          Tổng số đối tác: <strong className="text-foreground">{stats.totalSuppliers} NCC</strong>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Công nợ cũ đầu kỳ"
          value={formatNumber(stats.totalOldDebt)}
          icon={Layers}
          colorClass="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/60"
        />
        <StatCard
          label="Tổng tiền nhập hoa (+)"
          value={formatNumber(stats.totalImport)}
          icon={ArrowUpRight}
          colorClass="bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/60"
        />
        <StatCard
          label="Tổng tiền đã trả NCC (-)"
          value={formatNumber(stats.totalPaid)}
          icon={ArrowDownLeft}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/60"
        />
        <StatCard
          label="Tổng nợ phải trả NCC còn lại"
          value={formatNumber(stats.totalFinalDebt)}
          icon={Receipt}
          primary
        />
      </div>

      {/* Biểu đồ & Top danh sách nợ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biểu đồ phát sinh theo ngày */}
        <ChartCard
          title="Xu hướng Nhập hoa vs Thanh toán NCC theo ngày (Triệu VNĐ)"
          icon={<BarChart3 size={16} className="text-primary" />}
        >
          {ready && dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip
                  formatter={(val: any) => [`${formatNumber(Number(val) * 1000000)} đ`, '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Tiền nhập hoa" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tiền trả NCC" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              Chưa có dữ liệu phát sinh công nợ theo ngày
            </div>
          )}
        </ChartCard>

        {/* Biểu đồ Top Nhà cung cấp có dư nợ cao nhất */}
        <ChartCard
          title="Top Nhà Cung Cấp dư nợ cao nhất (Triệu VNĐ)"
          icon={<Coins size={16} className="text-emerald-600" />}
        >
          {ready && topChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topChartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={tick} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={110} />
                <Tooltip
                  formatter={(val: any) => [`${formatNumber(Number(val) * 1000000)} đ`, 'Dư nợ']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Dư nợ (Tr.đ)" radius={[0, 4, 4, 0]}>
                  {topChartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
              Không có nhà cung cấp nào đang còn dư nợ
            </div>
          )}
        </ChartCard>
      </div>

      {/* Bảng chi tiết Top Nhà vườn dư nợ & Tỷ trọng */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-600" />
            <h4 className="text-xs font-bold text-foreground">
              Chi tiết tỷ trọng công nợ các Nhà Cung Cấp hàng đầu
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
            {stats.countWithDebt} / {stats.totalSuppliers} NCC đang có dư nợ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2 px-3 w-12 text-center">#</th>
                <th className="py-2 px-3">Mã NCC</th>
                <th className="py-2 px-3">Tên Nhà Cung Cấp</th>
                <th className="py-2 px-3 text-right">Dư nợ hiện tại</th>
                <th className="py-2 px-3 text-right">Tỷ trọng (%)</th>
                <th className="py-2 px-3 w-40">Mức độ nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {topNccDebt.map((s, idx) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 text-center text-muted-foreground font-sans">{idx + 1}</td>
                  <td className="py-2 px-3 font-bold text-foreground">{s.code}</td>
                  <td className="py-2 px-3 font-semibold text-foreground font-sans">{s.name}</td>
                  <td className="py-2 px-3 font-extrabold text-right text-rose-600">
                    {formatNumber(s.finalDebt)} đ
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-muted-foreground">
                    {s.percentage}%
                  </td>
                  <td className="py-2 px-3">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, s.percentage))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {topNccDebt.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground font-sans">
                    Tuyệt vời! Hiện tại không có nhà cung cấp nào còn nợ tiền.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
