import { useMemo } from 'react';
import { Briefcase, DollarSign, UserCheck, Users } from 'lucide-react';
import { BarChartBox, ChartCard, StatCard, useChartReady } from '@/components/data/StatsKit';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';

export function NhanVienStats() {
  const { employees } = useEmployeeStore();
  const ready = useChartReady();

  const metrics = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'active').length;
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    const floralTeam = employees.filter((e) => e.department.includes('Cắm hoa')).length;
    return { total, active, totalSalary, floralTeam };
  }, [employees]);

  const byDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      map[e.department] = (map[e.department] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.length > 16 ? `${name.slice(0, 16)}...` : name,
      value,
    }));
  }, [employees]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-w-7xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Tổng số nhân sự" value={metrics.total} icon={Users} primary />
        <StatCard
          label="Nhân viên chính thức"
          value={metrics.active}
          icon={UserCheck}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Tổng quỹ lương tháng"
          value={formatVND(metrics.totalSalary)}
          icon={DollarSign}
          colorClass="bg-rose-500/10 text-rose-600 border-rose-200"
        />
        <StatCard
          label="Nghệ nhân & Cắm hoa"
          value={`${metrics.floralTeam} nhân sự`}
          icon={Briefcase}
          colorClass="bg-amber-500/10 text-amber-600 border-amber-200"
        />
      </div>

      {ready && (
        <div className="grid grid-cols-1 gap-5">
          <ChartCard
            title="Quy mô nhân sự theo từng phòng ban"
            icon={<Users size={15} className="text-primary" />}
          >
            <BarChartBox data={byDepartment} seriesName="Nhân sự" />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
