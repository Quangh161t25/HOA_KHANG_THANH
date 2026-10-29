import { useMemo } from 'react';
import { Boxes, Flower2, MapPin, Sparkles } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useFlowerStore } from '@/stores/hoaKhangThanhStore';

export function HoaStats() {
  const { flowers } = useFlowerStore();
  const ready = useChartReady();

  const metrics = useMemo(() => {
    const total = flowers.length;
    const totalStock = flowers.reduce((sum, f) => sum + f.stock, 0);
    const dalatCount = flowers.filter((f) => f.origin.includes('Đà Lạt')).length;
    const importCount = flowers.filter((f) => f.origin.includes('Nhập khẩu')).length;
    return { total, totalStock, dalatCount, importCount };
  }, [flowers]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    flowers.forEach((f) => {
      map[f.category] = (map[f.category] || 0) + f.stock;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [flowers]);

  const byOrigin = useMemo(() => {
    const map: Record<string, number> = {};
    flowers.forEach((f) => {
      map[f.origin] = (map[f.origin] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [flowers]);

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Tổng giống hoa" value={metrics.total} icon={Flower2} primary />
        <StatCard
          label="Tổng tồn kho (cành/bó)"
          value={metrics.totalStock.toLocaleString('vi-VN')}
          icon={Boxes}
          colorClass="bg-blue-500/10 text-blue-600 border-blue-200"
        />
        <StatCard
          label="Chủng loại hoa"
          value={byCategory.length}
          icon={Sparkles}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Hoa xuất xứ Đà Lạt"
          value={metrics.dalatCount}
          icon={MapPin}
          colorClass="bg-purple-500/10 text-purple-600 border-purple-200"
        />
        <StatCard
          label="Hoa nhập khẩu"
          value={metrics.importCount}
          icon={Boxes}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
      </div>

      {ready && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Lượng hoa tồn theo chủng loại" icon={<Flower2 size={15} className="text-primary" />}>
            <BarChartBox data={byCategory} seriesName="Số lượng cành/bó" />
          </ChartCard>

          <ChartCard title="Phân bổ giống hoa theo xuất xứ" icon={<MapPin size={15} className="text-primary" />}>
            <BarChartBox data={byOrigin} seriesName="Số giống hoa" layout="vertical" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
