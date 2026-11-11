import { useMemo } from 'react';
import { AlertTriangle, CreditCard, DollarSign, MapPin, Store, Trophy } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import {
  calculateDistributorFinancials,
  normalizeToISODate,
  useDebtStore,
  useDistributorStore,
  useOrderStore,
} from '@/stores/hoaKhangThanhStore';
import { getDaysDifference } from '@/lib/debtCheck';

export function NPPStats() {
  const { distributors } = useDistributorStore();
  const { orders } = useOrderStore();
  const { records: debtRecords } = useDebtStore();
  const ready = useChartReady();

  const enrichedDistributors = useMemo(() => {
    return distributors.map((d) => {
      const fin = calculateDistributorFinancials(d, debtRecords, orders);
      return {
        ...d,
        oldDebt: fin.oldDebt,
        salesAmount: fin.salesAmount,
        collectedAmount: fin.collectedAmount,
        finalDebt: fin.finalDebt,
        currentDebt: fin.finalDebt,
        totalRevenue: fin.totalRevenue,
      };
    });
  }, [distributors, debtRecords, orders]);

  const metrics = useMemo(() => {
    const total = enrichedDistributors.length;
    const totalDebt = enrichedDistributors.reduce((sum, d) => sum + (d.finalDebt ?? d.currentDebt ?? 0), 0);
    const totalRevenue = enrichedDistributors.reduce((sum, d) => sum + (d.salesAmount || d.totalRevenue || 0), 0);
    const vipCount = enrichedDistributors.filter((d) => d.tier.includes('VIP')).length;

    // Đếm NPP quá 3 ngày chưa lên đơn mới
    let overdueCount = 0;
    enrichedDistributors.forEach((d) => {
      const matching = orders.filter((o) => {
        const matchId = o.distributorId === d.id;
        const matchName =
          o.distributorName &&
          (o.distributorName.toLowerCase() === d.name.toLowerCase() ||
            d.name.toLowerCase().includes(o.distributorName.toLowerCase()) ||
            o.distributorName.toLowerCase().includes(d.name.toLowerCase()));
        const matchPhone =
          o.phone &&
          d.phone &&
          o.phone.replace(/\s+/g, '') === d.phone.replace(/\s+/g, '');
        return matchId || matchName || matchPhone;
      });

      const validOrders = matching.filter((o) => o.status !== 'huy' && o.status !== 'cancelled');
      const targetOrders = validOrders.length > 0 ? validOrders : matching;

      if (targetOrders.length > 0) {
        const sorted = [...targetOrders].sort((a, b) => {
          const dateA = normalizeToISODate(a.orderDate);
          const dateB = normalizeToISODate(b.orderDate);
          return dateB.localeCompare(dateA);
        });
        const latest = sorted[0];
        const days = Math.max(0, getDaysDifference(latest.orderDate));
        if (days > 3) {
          overdueCount++;
        }
      }
    });

    return { total, totalDebt, totalRevenue, vipCount, overdueCount };
  }, [enrichedDistributors, orders]);

  const byRevenue = useMemo(() => {
    return enrichedDistributors.map((d) => ({
      name: d.name.length > 15 ? `${d.name.slice(0, 15)}...` : d.name,
      value: (d.salesAmount || d.totalRevenue || 0) / 1000000,
    }));
  }, [enrichedDistributors]);

  const byRegion = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedDistributors.forEach((d) => {
      map[d.region] = (map[d.region] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [enrichedDistributors]);

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Tổng đại lý / Shop hoa" value={metrics.total} icon={Store} primary />
        <StatCard
          label="Quá 3 ngày chưa đặt"
          value={metrics.overdueCount}
          icon={AlertTriangle}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-300"
        />
        <StatCard
          label="Tổng doanh số tích lũy"
          value={formatNumber(metrics.totalRevenue)}
          icon={DollarSign}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Công nợ NPP còn thiếu"
          value={formatNumber(metrics.totalDebt)}
          icon={CreditCard}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
        <StatCard
          label="Đại lý VIP (Kim Cương / Vàng)"
          value={metrics.vipCount}
          icon={Trophy}
          colorClass="bg-amber-500/10 text-amber-600 border-amber-200"
        />
      </div>

      {ready && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Doanh số tích lũy theo từng đại lý (Triệu VNĐ)" icon={<DollarSign size={15} className="text-primary" />}>
            <BarChartBox data={byRevenue} seriesName="Triệu VNĐ" />
          </ChartCard>

          <ChartCard title="Mật độ nhà phân phối theo khu vực" icon={<MapPin size={15} className="text-primary" />}>
            <BarChartBox data={byRegion} seriesName="Số đại lý" layout="vertical" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
