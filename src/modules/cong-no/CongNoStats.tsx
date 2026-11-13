import { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Layers,
  Receipt,
  Store,
  Truck,
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
import { formatDate } from '@/lib/format';

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const tick = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };
const PIE_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4'];

export function CongNoStats() {
  const records = useAllDebtRecords();
  const ready = useChartReady();

  // NPP records and NCC records
  const nppRecords = useMemo(() => records.filter((r) => r.partnerType === 'npp'), [records]);
  const nccRecords = useMemo(() => records.filter((r) => r.partnerType === 'ncc'), [records]);

  // Aggregate stats
  const stats = useMemo(() => {
    // NPP
    const nppOldDebt = nppRecords.reduce((s, r) => s + (r.oldDebt || 0), 0);
    const nppSales = nppRecords.reduce((s, r) => s + (r.increaseAmount || 0), 0);
    const nppCollected = nppRecords.reduce((s, r) => s + (r.decreaseAmount || 0), 0);
    const nppFinalDebt = nppRecords.reduce((s, r) => s + (r.finalDebt || 0), 0);

    // NCC
    const nccOldDebt = nccRecords.reduce((s, r) => s + (r.oldDebt || 0), 0);
    const nccImport = nccRecords.reduce((s, r) => s + (r.increaseAmount || 0), 0);
    const nccPaid = nccRecords.reduce((s, r) => s + (r.decreaseAmount || 0), 0);
    const nccFinalDebt = nccRecords.reduce((s, r) => s + (r.finalDebt || 0), 0);

    return {
      nppOldDebt,
      nppSales,
      nppCollected,
      nppFinalDebt,
      nccOldDebt,
      nccImport,
      nccPaid,
      nccFinalDebt,
    };
  }, [nppRecords, nccRecords]);

  // Daily trend: group by date
  const dailyChartData = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).sort();
    return dates.map((d) => {
      const recs = records.filter((r) => r.date === d);
      const nppBan = recs
        .filter((r) => r.partnerType === 'npp')
        .reduce((s, r) => s + (r.increaseAmount || 0), 0) / 1000000;
      const nppThu = recs
        .filter((r) => r.partnerType === 'npp')
        .reduce((s, r) => s + (r.decreaseAmount || 0), 0) / 1000000;
      const nccNhap = recs
        .filter((r) => r.partnerType === 'ncc')
        .reduce((s, r) => s + (r.increaseAmount || 0), 0) / 1000000;
      const nccTra = recs
        .filter((r) => r.partnerType === 'ncc')
        .reduce((s, r) => s + (r.decreaseAmount || 0), 0) / 1000000;

      return {
        date: formatDate(d),
        'NPP Bán hoa': Math.round(nppBan * 10) / 10,
        'NPP Thu nợ': Math.round(nppThu * 10) / 10,
        'NCC Nhập hoa': Math.round(nccNhap * 10) / 10,
        'NCC Trả tiền': Math.round(nccTra * 10) / 10,
      };
    });
  }, [records]);

  // Top NPP debt
  const topNppDebt = useMemo(() => {
    const map: Record<string, { name: string; finalDebt: number }> = {};
    nppRecords.forEach((r) => {
      if (!map[r.partnerId]) {
        map[r.partnerId] = { name: r.partnerName, finalDebt: 0 };
      }
      map[r.partnerId].finalDebt += r.finalDebt || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.finalDebt - a.finalDebt)
      .slice(0, 5)
      .map((item) => ({
        name: item.name.length > 20 ? `${item.name.slice(0, 18)}...` : item.name,
        value: Math.round((item.finalDebt / 1000000) * 10) / 10,
      }));
  }, [nppRecords]);

  // Top NCC debt
  const topNccDebt = useMemo(() => {
    const map: Record<string, { name: string; finalDebt: number }> = {};
    nccRecords.forEach((r) => {
      if (!map[r.partnerId]) {
        map[r.partnerId] = { name: r.partnerName, finalDebt: 0 };
      }
      map[r.partnerId].finalDebt += r.finalDebt || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.finalDebt - a.finalDebt)
      .slice(0, 5)
      .map((item) => ({
        name: item.name.length > 20 ? `${item.name.slice(0, 18)}...` : item.name,
        value: Math.round((item.finalDebt / 1000000) * 10) / 10,
      }));
  }, [nccRecords]);

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      {/* KPI Cards cho NPP */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Store size={16} className="text-purple-600" />
          <h3 className="text-sm font-bold text-foreground">
            Tổng quan công nợ Nhà Phân Phối (NPP / Đại lý hoa)
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Công nợ cũ đầu kỳ"
            value={formatNumber(stats.nppOldDebt)}
            icon={Layers}
            colorClass="bg-purple-500/10 text-purple-600 border-purple-200"
          />
          <StatCard
            label="Tổng tiền bán hoa (+)"
            value={formatNumber(stats.nppSales)}
            icon={ArrowUpRight}
            colorClass="bg-blue-500/10 text-blue-600 border-blue-200"
          />
          <StatCard
            label="Tổng tiền thu nợ (-)"
            value={formatNumber(stats.nppCollected)}
            icon={ArrowDownLeft}
            colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
          />
          <StatCard
            label="Tổng công nợ cuối còn lại"
            value={formatNumber(stats.nppFinalDebt)}
            icon={Receipt}
            primary
          />
        </div>
      </div>

      {/* KPI Cards cho NCC */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Truck size={16} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-foreground">
            Tổng quan công nợ Nhà Cung Cấp (NCC / Nhà vườn)
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Công nợ cũ đầu kỳ"
            value={formatNumber(stats.nccOldDebt)}
            icon={Layers}
            colorClass="bg-amber-500/10 text-amber-600 border-amber-200"
          />
          <StatCard
            label="Tổng tiền nhập hoa (+)"
            value={formatNumber(stats.nccImport)}
            icon={ArrowUpRight}
            colorClass="bg-orange-500/10 text-orange-600 border-orange-200"
          />
          <StatCard
            label="Tổng tiền trả NCC (-)"
            value={formatNumber(stats.nccPaid)}
            icon={ArrowDownLeft}
            colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
          />
          <StatCard
            label="Tổng công nợ cuối còn lại"
            value={formatNumber(stats.nccFinalDebt)}
            icon={Receipt}
            colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
          />
        </div>
      </div>

      {/* Biểu đồ diễn biến phát sinh công nợ theo ngày */}
      <ChartCard
        title="Biến động tiền phát sinh công nợ theo từng ngày (Triệu đồng)"
        icon={<BarChart3 size={16} className="text-primary" />}
      >
        {ready ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="date" tick={tick} />
              <YAxis tick={tick} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${formatNumber(val * 1000000)}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="NPP Bán hoa" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NPP Thu nợ" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NCC Nhập hoa" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NCC Trả tiền" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
            Đang tải dữ liệu biểu đồ...
          </div>
        )}
      </ChartCard>

      {/* Top 5 nợ nhiều nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top NPP */}
        <ChartCard
          title="Top 5 NPP có dư nợ cao nhất (Triệu đồng)"
          icon={<Store size={16} className="text-purple-600" />}
        >
          {ready ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={topNppDebt} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" tick={tick} />
                <YAxis dataKey="name" type="category" tick={tick} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${formatNumber(val * 1000000)}`, 'Dư nợ']}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {topNppDebt.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[230px] flex items-center justify-center text-xs text-muted-foreground">
              Đang tải...
            </div>
          )}
        </ChartCard>

        {/* Top NCC */}
        <ChartCard
          title="Top 5 NCC cần thanh toán cao nhất (Triệu đồng)"
          icon={<Truck size={16} className="text-emerald-600" />}
        >
          {ready ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={topNccDebt} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" tick={tick} />
                <YAxis dataKey="name" type="category" tick={tick} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${formatNumber(val * 1000000)}`, 'Cần thanh toán']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {topNccDebt.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[230px] flex items-center justify-center text-xs text-muted-foreground">
              Đang tải...
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
