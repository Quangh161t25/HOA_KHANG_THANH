import { useMemo } from 'react';
import { DollarSign, MapPin, Star, Truck } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useSupplierStore } from '@/stores/hoaKhangThanhStore';

export function NCCStats() {
  const { suppliers } = useSupplierStore();
  const ready = useChartReady();

  const metrics = useMemo(() => {
    const total = suppliers.length;
    const totalDebt = suppliers.reduce((sum, s) => sum + s.totalDebt, 0);
    const dalatCount = suppliers.filter((s) => s.address.includes('Lâm Đồng') || s.address.includes('Đà Lạt')).length;
    const avgRating = (suppliers.reduce((sum, s) => sum + s.rating, 0) / (total || 1)).toFixed(1);
    return { total, totalDebt, dalatCount, avgRating };
  }, [suppliers]);

  const byDebt = useMemo(() => {
    return suppliers.map((s) => ({
      name: s.name.length > 15 ? `${s.name.slice(0, 15)}...` : s.name,
      value: s.totalDebt / 1000000,
    }));
  }, [suppliers]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tổng đối tác NCC" value={metrics.total} icon={Truck} primary />
        <StatCard label="Tổng nợ phải trả NCC" value={formatVND(metrics.totalDebt)} icon={DollarSign} colorClass="bg-rose-500/10 text-rose-600 border-rose-200" />
        <StatCard label="Nhà vườn Đà Lạt" value={metrics.dalatCount} icon={MapPin} colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200" />
        <StatCard label="Điểm đánh giá TB" value={`${metrics.avgRating} ⭐`} icon={Star} colorClass="bg-amber-500/10 text-amber-600 border-amber-200" />
      </div>

      {ready && (
        <div className="grid grid-cols-1 gap-5">
          <ChartCard title="Công nợ cần thanh toán cho từng nhà cung cấp (Triệu VNĐ)" icon={<DollarSign size={15} className="text-primary" />}>
            <BarChartBox data={byDebt} seriesName="Triệu VNĐ" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
