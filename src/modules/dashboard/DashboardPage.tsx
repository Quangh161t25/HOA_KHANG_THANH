import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Flower2,
  PackagePlus,
  Plus,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import {
  useCashStore,
  useEmployeeStore,
  useDistributorStore,
  useFlowerStore,
  useInventoryStore,
  useOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import { formatDate } from '@/lib/format';

const PIE_COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { orders } = useOrderStore();
  const employees = useEmployeeStore((state) => state.employees);
  const { flowers } = useFlowerStore();
  const { distributors } = useDistributorStore();
  const { suppliers } = useSupplierStore();
  const { inventory } = useInventoryStore();
  const { transactions } = useCashStore();

  // Metrics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.currentStock <= i.minStock).length;
  }, [inventory]);

  const cashSummary = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [transactions]);

  const revenueChartData = Array.from({ length: 7 }, (_, index) => {
    const date = dayjs().subtract(6 - index, 'day');
    const dailyOrders = orders.filter((order) =>
      order.status !== 'cancelled' && order.status !== 'huy' && dayjs(order.orderDate).isSame(date, 'day'));
    return { date: date.format('DD/MM'), revenue: dailyOrders.reduce((sum, order) => sum + order.totalAmount, 0), orders: dailyOrders.length };
  });

  // Category distribution
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    flowers.forEach((fl) => {
      map[fl.category] = (map[fl.category] || 0) + fl.stock;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [flowers]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"><CheckCircle2 size={12} /> Hoàn thành</span>;
      case 'delivering':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400"><Truck size={12} /> Đang giao</span>;
      case 'processing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"><Clock size={12} /> Đang xử lý</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"><Clock size={12} /> Chờ duyệt</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/15 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Flower2 size={24} />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Hệ thống Quản lý Hoa Khang Thành
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Tổng quan tình hình kinh doanh, kho bãi và dòng tiền phân phối hoa tươi hôm nay
              </p>
            </div>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/don-hang')}
            className="gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Tạo đơn sỉ mới
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/ton-kho')}
            className="gap-1.5 bg-card hover:bg-accent"
          >
            <PackagePlus size={16} /> Nhập kho hoa
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/thu-chi')}
            className="gap-1.5 bg-card hover:bg-accent"
          >
            <Wallet size={16} /> Sổ quỹ thu chi
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng doanh thu đơn hàng</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatVND(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight size={14} />
              <span>Tổng hợp từ đơn hàng hiện có</span>
            </div>
          </div>
        </div>

        {/* Đơn hàng & chờ xử lý */}
        <div
          onClick={() => navigate('/don-hang')}
          className="rounded-2xl border border-border bg-card p-4.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đơn hàng cần xử lý</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{pendingOrdersCount}</span>
              <span className="text-xs font-normal text-muted-foreground">/ {orders.length} tổng đơn</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <span>Xem chi tiết danh sách đơn →</span>
            </div>
          </div>
        </div>

        {/* Tồn kho & Cảnh báo */}
        <div
          onClick={() => navigate('/ton-kho')}
          className="rounded-2xl border border-border bg-card p-4.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tồn kho & Cảnh báo</span>
            <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'} group-hover:scale-105 transition-transform`}>
              <Boxes size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground tracking-tight flex items-baseline gap-2">
              <span>{flowers.reduce((acc, f) => acc + f.stock, 0).toLocaleString('vi-VN')}</span>
              <span className="text-xs font-normal text-muted-foreground">cành / bó</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-medium">
              {lowStockCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={14} /> Có {lowStockCount} mặt hàng sắp hết
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Tồn kho đảm bảo an toàn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tồn quỹ thực tế (Thu - Chi) */}
        <div
          onClick={() => navigate('/thu-chi')}
          className="rounded-2xl border border-border bg-card p-4.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tồn quỹ ròng (Sổ quỹ)</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold tracking-tight ${cashSummary.balance >= 0 ? 'text-foreground' : 'text-rose-600'}`}>
              {formatVND(cashSummary.balance)}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1 text-[11px] text-muted-foreground font-medium">
              <span className="text-emerald-600">Thu: {formatVND(cashSummary.totalIncome)}</span>
              <span className="text-rose-500">Chi: {formatVND(cashSummary.totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Overview: NPP & NCC stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/hoa')}
          className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-600 shrink-0">
            <Flower2 size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{flowers.length} Giống hoa tươi</div>
            <div className="text-xs text-muted-foreground">Đang phân phối sỉ toàn quốc</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/nha-phan-phoi')}
          className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-600 shrink-0">
            <Store size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{distributors.length} Nhà phân phối</div>
            <div className="text-xs text-muted-foreground">Chuỗi đại lý & shop hoa VIP</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/nha-cung-cap')}
          className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{suppliers.length} Nhà vườn / NCC</div>
            <div className="text-xs text-muted-foreground">Đà Lạt, Mê Linh, Sa Đéc, Hà Lan</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/nhan-vien')}
          className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{employees.length} Nhân viên công ty</div>
            <div className="text-xs text-muted-foreground">Cắm hoa, Kho lạnh & Kinh doanh</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doanh thu 7 ngày */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Biểu đồ doanh thu 7 ngày gần đây</h2>
              <p className="text-xs text-muted-foreground">Doanh số xuất bán sỉ hoa tươi theo ngày</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground">
              {dayjs().subtract(6, 'day').format('DD/MM')} – {dayjs().format('DD/MM/YYYY')}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000000}tr`}
                />
                <Tooltip
                  formatter={(value: number) => [formatVND(value), 'Doanh thu']}
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phân bổ tồn kho theo nhóm hoa */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Cơ cấu loại hoa trong kho</h2>
            <p className="text-xs text-muted-foreground">Tỷ lệ số lượng cành/bó theo chủng loại</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} đơn vị`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
            {categoryChartData.slice(0, 6).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate text-muted-foreground">{item.name}:</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đơn hàng mới nhất */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Đơn đặt hàng sỉ mới nhất</h2>
              <p className="text-xs text-muted-foreground">Các đơn hàng từ đại lý cần đóng gói & xuất kho</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/don-hang')}
              className="text-xs text-primary hover:text-primary/80"
            >
              Xem tất cả →
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                onClick={() => navigate('/don-hang')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-primary">{order.code}</span>
                    <span className="text-xs font-semibold text-foreground truncate">{order.distributorName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-mono">{formatDate(order.orderDate)}</span>
                    <span>•</span>
                    <span>{order.items.length} loại hoa</span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs font-bold text-foreground">{formatVND(order.totalAmount)}</div>
                  <div>{getOrderStatusBadge(order.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cảnh báo tồn kho hoa & giao dịch gần đây */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Cảnh báo kho lạnh & Nhập gấp</h2>
              <p className="text-xs text-muted-foreground">Các loại hoa có lượng tồn dưới ngưỡng tối thiểu</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ton-kho')}
              className="text-xs text-primary hover:text-primary/80"
            >
              Quản lý kho →
            </Button>
          </div>

          <div className="space-y-2.5">
            {inventory
              .filter((i) => i.currentStock <= i.minStock)
              .concat(inventory.filter((i) => i.currentStock > i.minStock))
              .slice(0, 5)
              .map((item) => {
                const isLow = item.currentStock <= item.minStock;
                return (
                  <div
                    key={item.flowerId}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isLow
                        ? 'border-amber-300/60 bg-amber-500/5 dark:border-amber-800/60'
                        : 'border-border/60 bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isLow ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Flower2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{item.flowerName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{item.warehouse}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-foreground">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-[11px]">
                        {isLow ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Cần nhập thêm</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Đủ hàng</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
