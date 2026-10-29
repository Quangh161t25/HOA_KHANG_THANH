import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useCashStore } from '@/stores/hoaKhangThanhStore';

export function ThuChiStats() {
  const { transactions } = useCashStore();
  const ready = useChartReady();

  const metrics = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const count = transactions.length;

    return { totalIncome, totalExpense, balance, count };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      const key = t.category.length > 18 ? `${t.category.slice(0, 18)}...` : t.category;
      map[key] = (map[key] || 0) + t.amount / 1000000;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 10) / 10,
    }));
  }, [transactions]);

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Tồn quỹ ròng khả dụng"
          value={formatNumber(metrics.balance)}
          icon={Wallet}
          primary
        />
        <StatCard
          label="Tổng tiền thu vào"
          value={formatNumber(metrics.totalIncome)}
          icon={ArrowDownLeft}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Tổng tiền chi ra"
          value={formatNumber(metrics.totalExpense)}
          icon={ArrowUpRight}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
        <StatCard
          label="Tổng số phiếu giao dịch"
          value={`${metrics.count} phiếu`}
          icon={DollarSign}
          colorClass="bg-blue-500/10 text-blue-600 border-blue-200"
        />
      </div>

      {ready && (
        <div className="grid grid-cols-1 gap-5">
          <ChartCard
            title="Dòng tiền theo hạng mục thu chi (Triệu VNĐ)"
            icon={<DollarSign size={15} className="text-primary" />}
          >
            <BarChartBox data={byCategory} seriesName="Triệu VNĐ" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
