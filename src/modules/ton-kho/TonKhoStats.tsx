import { useMemo } from 'react';
import { AlertTriangle, Boxes, DollarSign, PackageCheck, Thermometer } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useInventoryStore } from '@/stores/hoaKhangThanhStore';

export function TonKhoStats() {
  const { inventory } = useInventoryStore();
  const ready = useChartReady();

  const metrics = useMemo(() => {
    const totalItems = inventory.reduce((sum, i) => sum + i.currentStock, 0);
    const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.costPrice, 0);
    const lowCount = inventory.filter((i) => i.currentStock <= i.minStock).length;
    const warehouseCount = new Set(inventory.map((i) => i.warehouse)).size;
    return { totalItems, totalValue, lowCount, warehouseCount };
  }, [inventory]);

  const byWarehouse = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((i) => {
      map[i.warehouse] = (map[i.warehouse] || 0) + i.currentStock;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.currentStock;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tổng tồn kho thực tế" value={`${metrics.totalItems.toLocaleString('vi-VN')} cành/bó`} icon={Boxes} primary />
        <StatCard label="Giá trị vốn tồn kho" value={formatVND(metrics.totalValue)} icon={DollarSign} colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200" />
        <StatCard label="Cảnh báo cần nhập gấp" value={`${metrics.lowCount} loại hoa`} icon={AlertTriangle} colorClass="bg-amber-500/10 text-amber-600 border-amber-200" />
        <StatCard label="Hệ thống kho lạnh" value={`${metrics.warehouseCount} kho lưu trữ`} icon={Thermometer} colorClass="bg-blue-500/10 text-blue-600 border-blue-200" />
      </div>

      {ready && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Số lượng tồn theo kho lạnh" icon={<Boxes size={15} className="text-primary" />}>
            <BarChartBox data={byWarehouse} seriesName="Số cành/bó" />
          </ChartCard>

          <ChartCard title="Phân bổ lượng hoa theo chủng loại" icon={<PackageCheck size={15} className="text-primary" />}>
            <BarChartBox data={byCategory} seriesName="Số cành/bó" layout="vertical" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
