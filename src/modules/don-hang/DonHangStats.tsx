import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  Flower2,
  Layers,
  ListFilter,
  PackageCheck,
  Search,
  ShoppingCart,
  TrendingUp,
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
import { useOrderStore, useFlowerStore } from '@/stores/hoaKhangThanhStore';
import { formatDate, todayISODate } from '@/lib/format';
import type { Order } from '@/types/hoaKhangThanh';

type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom';
type ViewMode = 'aggregated' | 'detailed' | 'profit';
type ProfitSubView = 'flower' | 'order';

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

interface DetailedPurchaseRow {
  orderId: string;
  orderCode: string;
  orderDate: string;
  partnerName: string;
  flowerCode: string;
  flowerName: string;
  customName: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  amount: number;
  profit: number;
  orderStatus: Order['status'];
}

interface AggregatedProfitFlowerRow {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  customName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgUnitPrice: number;
  avgCostPrice: number;
  profitMargin: number;
  profitShare: number;
  orderCount: number;
}

interface OrderProfitRow {
  orderId: string;
  orderCode: string;
  orderDate: string;
  partnerName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  orderStatus: Order['status'];
}

export function DonHangStats() {
  const { orders } = useOrderStore();
  const { flowers } = useFlowerStore();
  const ready = useChartReady();

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('aggregated');
  const [profitSubView, setProfitSubView] = useState<ProfitSubView>('flower');

  // Pagination for the report table
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Format numbers with dots and NO currency symbol
  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  // Map flowers by ID and Code for lookup of customName (tên riêng) & costPrice (giá vốn)
  const flowerMap = useMemo(() => {
    const map = new Map<string, { customName: string; costPrice: number }>();
    flowers.forEach((f) => {
      const data = { customName: f.customName || '', costPrice: f.costPrice || 0 };
      if (f.id) map.set(f.id, data);
      if (f.code) map.set(f.code.trim().toLowerCase(), data);
    });
    return map;
  }, [flowers]);

  // Top metric overview (Bao gồm Doanh số, Giá vốn, Lợi nhuận gộp & Tỷ suất lợi nhuận)
  const metrics = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) => o.status === 'da_xac_nhan' || o.status === 'processing').length;
    const delivering = orders.filter((o) => o.status === 'dang_giao' || o.status === 'delivering').length;
    const completed = orders.filter((o) => o.status === 'hoan_thanh' || o.status === 'completed').length;
    const totalVal = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    let totalCost = 0;
    let totalProfit = 0;

    orders.forEach((o) => {
      let oCost = 0;
      o.items?.forEach((item) => {
        const flower = flowerMap.get(item.flowerId) || flowerMap.get((item.flowerCode || '').trim().toLowerCase());
        const costP = item.costPrice || flower?.costPrice || 0;
        const c = item.importTotal || (item.quantity * costP);
        oCost += c;
      });
      if (o.totalCost !== undefined && o.totalCost > 0) {
        oCost = o.totalCost;
      }
      totalCost += oCost;
      const oProfit = o.totalProfit !== undefined && o.totalProfit !== 0 ? o.totalProfit : Math.max(0, o.totalAmount - oCost);
      totalProfit += oProfit;
    });

    const profitMargin = totalVal > 0 ? Math.round((totalProfit / totalVal) * 1000) / 10 : 0;

    return { total, confirmed, delivering, completed, totalVal, totalCost, totalProfit, profitMargin };
  }, [orders, flowerMap]);

  // Chart: revenue by partner
  const byPartner = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const name = o.distributorName.length > 15 ? `${o.distributorName.slice(0, 15)}...` : o.distributorName;
      map[name] = (map[name] || 0) + o.totalAmount / 1000000;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value * 10) / 10,
    }));
  }, [orders]);

  // Chart: order status
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {
      'Nháp': 0,
      'Đã xác nhận': 0,
      'Đang giao': 0,
      'Hoàn thành': 0,
    };
    orders.forEach((o) => {
      if (o.status === 'nhap' || o.status === 'pending') map['Nháp']++;
      else if (o.status === 'da_xac_nhan' || o.status === 'processing') map['Đã xác nhận']++;
      else if (o.status === 'dang_giao' || o.status === 'delivering') map['Đang giao']++;
      else if (o.status === 'hoan_thanh' || o.status === 'completed') map['Hoàn thành']++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Quick date preset handlers
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    setPage(1);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const s = toISO(today);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const s = toISO(y);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === '7days') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 6);
      setStartDate(toISO(past7));
      setEndDate(toISO(today));
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toISO(startOfMonth));
      setEndDate(toISO(today));
    }
  };

  // Unique partner list for dropdown
  const partnerList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.distributorName) set.add(o.distributorName);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Normalize date helper
  const normalizeDate = (dStr?: string) => {
    if (!dStr) return '';
    const trimmed = dStr.trim();
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return trimmed;
  };

  // Filter orders by date and partner
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = normalizeDate(o.orderDate);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      if (selectedPartner !== 'all' && o.distributorName !== selectedPartner) return false;
      return true;
    });
  }, [orders, startDate, endDate, selectedPartner]);

  // Chart: Top hoa sinh lời cao nhất (Lợi nhuận gộp - Triệu)
  const topProfitFlowers = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const flower = flowerMap.get(item.flowerId) || flowerMap.get((item.flowerCode || '').trim().toLowerCase());
        const costP = item.costPrice || flower?.costPrice || 0;
        const c = item.importTotal || (item.quantity * costP);
        const amt = item.amount || (item.quantity * (item.unitPrice || 0));
        const p = item.profit !== undefined && item.profit !== 0 ? item.profit : (amt - c);

        const name = item.flowerName.length > 13 ? `${item.flowerName.slice(0, 13)}...` : item.flowerName;
        map[name] = (map[name] || 0) + p / 1000000;
      });
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredOrders, flowerMap]);

  // Extract all purchased flower items from filtered orders
  const allPurchasedItems = useMemo<DetailedPurchaseRow[]>(() => {
    const rows: DetailedPurchaseRow[] = [];
    const q = searchTerm.toLowerCase().trim();

    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const flowerInfo =
          flowerMap.get(item.flowerId) || flowerMap.get((item.flowerCode || '').trim().toLowerCase());
        const customName = flowerInfo?.customName || '';
        const costPrice = item.costPrice || flowerInfo?.costPrice || 0;
        const itemCost = item.importTotal || (item.quantity * costPrice);
        const profit = item.profit !== undefined && item.profit !== 0 ? item.profit : (item.amount - itemCost);

        const matchSearch =
          !q ||
          item.flowerName.toLowerCase().includes(q) ||
          item.flowerCode.toLowerCase().includes(q) ||
          customName.toLowerCase().includes(q) ||
          o.distributorName.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q);

        if (matchSearch) {
          rows.push({
            orderId: o.id,
            orderCode: o.code,
            orderDate: o.orderDate,
            partnerName: o.distributorName,
            flowerCode: item.flowerCode || '—',
            flowerName: item.flowerName,
            customName,
            quantity: item.quantity,
            costPrice,
            unitPrice: item.unitPrice,
            amount: item.amount,
            profit,
            orderStatus: o.status,
          });
        }
      });
    });

    // Sort newest date first
    return rows.sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
  }, [filteredOrders, flowerMap, searchTerm]);

  // Aggregate by flower (Gom nhóm theo loại hoa cho báo cáo bán hàng)
  const aggregatedFlowerRows = useMemo<AggregatedFlowerRow[]>(() => {
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

    allPurchasedItems.forEach((item) => {
      const key = `${item.flowerCode}_${item.flowerName}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.amount;
        existing.prices.push(item.unitPrice);
        existing.orderCount += 1;
        if (!existing.customName && item.customName) {
          existing.customName = item.customName;
        }
      } else {
        map.set(key, {
          flowerId: item.flowerCode,
          flowerCode: item.flowerCode,
          flowerName: item.flowerName,
          customName: item.customName,
          totalQuantity: item.quantity,
          totalAmount: item.amount,
          prices: [item.unitPrice],
          orderCount: 1,
        });
      }
    });

    const totalRevenue = Array.from(map.values()).reduce((sum, f) => sum + f.totalAmount, 0);

    return Array.from(map.values())
      .map((item) => {
        const minPrice = Math.min(...item.prices);
        const maxPrice = Math.max(...item.prices);
        const averagePrice = item.totalQuantity > 0 ? Math.round(item.totalAmount / item.totalQuantity) : 0;
        const percentage = totalRevenue > 0 ? Math.round((item.totalAmount / totalRevenue) * 1000) / 10 : 0;

        return {
          flowerId: item.flowerId,
          flowerCode: item.flowerCode,
          flowerName: item.flowerName,
          customName: item.customName,
          totalQuantity: item.totalQuantity,
          totalAmount: item.totalAmount,
          averagePrice,
          minPrice,
          maxPrice,
          orderCount: item.orderCount,
          percentage,
        };
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [allPurchasedItems]);

  // BÁO CÁO LỢI NHUẬN: Gom nhóm theo loại hoa (Doanh thu, Chi phí vốn, Lợi nhuận gộp & Tỷ suất lợi nhuận)
  const aggregatedProfitRows = useMemo<AggregatedProfitFlowerRow[]>(() => {
    const map = new Map<
      string,
      {
        flowerId: string;
        flowerCode: string;
        flowerName: string;
        customName: string;
        totalQuantity: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        prices: number[];
        costPrices: number[];
        orderCount: number;
      }
    >();

    allPurchasedItems.forEach((item) => {
      const key = `${item.flowerCode}_${item.flowerName}`.toLowerCase();
      const existing = map.get(key);
      const itemCost = item.quantity * item.costPrice;
      const itemProfit = item.profit;

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.amount;
        existing.totalCost += itemCost;
        existing.totalProfit += itemProfit;
        existing.prices.push(item.unitPrice);
        if (item.costPrice > 0) existing.costPrices.push(item.costPrice);
        existing.orderCount += 1;
        if (!existing.customName && item.customName) {
          existing.customName = item.customName;
        }
      } else {
        map.set(key, {
          flowerId: item.flowerCode,
          flowerCode: item.flowerCode,
          flowerName: item.flowerName,
          customName: item.customName,
          totalQuantity: item.quantity,
          totalRevenue: item.amount,
          totalCost: itemCost,
          totalProfit: itemProfit,
          prices: [item.unitPrice],
          costPrices: item.costPrice > 0 ? [item.costPrice] : [],
          orderCount: 1,
        });
      }
    });

    const overallProfit = Array.from(map.values()).reduce((sum, f) => sum + f.totalProfit, 0);

    return Array.from(map.values())
      .map((item) => {
        const avgUnitPrice = item.totalQuantity > 0 ? Math.round(item.totalRevenue / item.totalQuantity) : 0;
        const avgCostPrice = item.totalQuantity > 0 ? Math.round(item.totalCost / item.totalQuantity) : 0;
        const profitMargin = item.totalRevenue > 0 ? Math.round((item.totalProfit / item.totalRevenue) * 1000) / 10 : 0;
        const profitShare = overallProfit > 0 ? Math.round((item.totalProfit / overallProfit) * 1000) / 10 : 0;

        return {
          flowerId: item.flowerId,
          flowerCode: item.flowerCode,
          flowerName: item.flowerName,
          customName: item.customName,
          totalQuantity: item.totalQuantity,
          totalRevenue: item.totalRevenue,
          totalCost: item.totalCost,
          totalProfit: item.totalProfit,
          avgUnitPrice,
          avgCostPrice,
          profitMargin,
          profitShare,
          orderCount: item.orderCount,
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit); // Xếp loại hoa có lãi cao nhất lên đầu
  }, [allPurchasedItems]);

  // BÁO CÁO LỢI NHUẬN: Chi tiết theo từng đơn hàng
  const orderProfitRows = useMemo<OrderProfitRow[]>(() => {
    const q = searchTerm.toLowerCase().trim();
    return filteredOrders
      .filter((o) => {
        if (!q) return true;
        return (
          o.code.toLowerCase().includes(q) ||
          o.distributorName.toLowerCase().includes(q) ||
          o.items.some((i) => i.flowerName.toLowerCase().includes(q))
        );
      })
      .map((o) => {
        let oCost = 0;
        let oQty = 0;
        o.items?.forEach((item) => {
          const flower = flowerMap.get(item.flowerId) || flowerMap.get((item.flowerCode || '').trim().toLowerCase());
          const costP = item.costPrice || flower?.costPrice || 0;
          const c = item.importTotal || (item.quantity * costP);
          oCost += c;
          oQty += item.quantity || 0;
        });
        if (o.totalCost !== undefined && o.totalCost > 0) {
          oCost = o.totalCost;
        }
        const oProfit = o.totalProfit !== undefined && o.totalProfit !== 0 ? o.totalProfit : (o.totalAmount - oCost);
        const profitMargin = o.totalAmount > 0 ? Math.round((oProfit / o.totalAmount) * 1000) / 10 : 0;

        return {
          orderId: o.id,
          orderCode: o.code,
          orderDate: o.orderDate,
          partnerName: o.distributorName,
          totalQuantity: o.totalQuantity || oQty,
          totalRevenue: o.totalAmount,
          totalCost: oCost,
          totalProfit: oProfit,
          profitMargin,
          orderStatus: o.status,
        };
      })
      .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
  }, [filteredOrders, flowerMap, searchTerm]);

  // Overall KPI totals for the filtered range
  const summaryReportKPI = useMemo(() => {
    const totalQty = allPurchasedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = allPurchasedItems.reduce((sum, i) => sum + i.amount, 0);
    const uniqueFlowers = aggregatedFlowerRows.length;
    const uniqueOrders = new Set(allPurchasedItems.map((i) => i.orderCode)).size;
    return { totalQty, totalAmount, uniqueFlowers, uniqueOrders };
  }, [allPurchasedItems, aggregatedFlowerRows]);

  // Profit KPI totals for filtered range
  const summaryProfitKPI = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalQuantity = 0;

    aggregatedProfitRows.forEach((r) => {
      totalRevenue += r.totalRevenue;
      totalCost += r.totalCost;
      totalProfit += r.totalProfit;
      totalQuantity += r.totalQuantity;
    });

    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

    return { totalRevenue, totalCost, totalProfit, totalQuantity, profitMargin };
  }, [aggregatedProfitRows]);

  // Paginated data for view
  const paginatedAggregated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return aggregatedFlowerRows.slice(start, start + pageSize);
  }, [aggregatedFlowerRows, page, pageSize]);

  const paginatedDetailed = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allPurchasedItems.slice(start, start + pageSize);
  }, [allPurchasedItems, page, pageSize]);

  const paginatedProfitFlowers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return aggregatedProfitRows.slice(start, start + pageSize);
  }, [aggregatedProfitRows, page, pageSize]);

  const paginatedProfitOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orderProfitRows.slice(start, start + pageSize);
  }, [orderProfitRows, page, pageSize]);

  const currentTotalRows = useMemo(() => {
    if (viewMode === 'aggregated') return aggregatedFlowerRows.length;
    if (viewMode === 'detailed') return allPurchasedItems.length;
    if (viewMode === 'profit') {
      return profitSubView === 'flower' ? aggregatedProfitRows.length : orderProfitRows.length;
    }
    return 0;
  }, [viewMode, profitSubView, aggregatedFlowerRows.length, allPurchasedItems.length, aggregatedProfitRows.length, orderProfitRows.length]);

  const totalReportPages = useMemo(() => {
    return Math.max(1, Math.ceil(currentTotalRows / pageSize));
  }, [currentTotalRows, pageSize]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (viewMode === 'profit') {
      if (profitSubView === 'flower') {
        const exportData = aggregatedProfitRows.map((r, index) => ({
          'STT': index + 1,
          'Mã hoa': r.flowerCode,
          'Tên hoa': r.flowerName,
          'Tên riêng': r.customName || '',
          'Số lượng bán': r.totalQuantity,
          'Giá vốn TB': r.avgCostPrice,
          'Giá bán TB': r.avgUnitPrice,
          'Tổng tiền vốn': r.totalCost,
          'Doanh thu bán': r.totalRevenue,
          'Lợi nhuận gộp': r.totalProfit,
          'Tỷ suất LN (%)': `${r.profitMargin}%`,
          'Tỷ trọng đóng góp LN (%)': `${r.profitShare}%`,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Loi_Nhuan_Theo_Hoa');
        XLSX.writeFile(wb, `Bao_Cao_Loi_Nhuan_Theo_Hoa_${todayISODate()}.xlsx`);
        toast.success('Đã xuất file Excel Báo cáo lợi nhuận theo loại hoa thành công');
      } else {
        const exportData = orderProfitRows.map((r, index) => ({
          'STT': index + 1,
          'Ngày đặt': formatDate(r.orderDate),
          'Mã đơn hàng': r.orderCode,
          'NPP / Khách hàng': r.partnerName,
          'Tổng số lượng hoa': r.totalQuantity,
          'Tổng tiền vốn': r.totalCost,
          'Doanh số bán': r.totalRevenue,
          'Lợi nhuận đơn': r.totalProfit,
          'Tỷ suất LN (%)': `${r.profitMargin}%`,
          'Trạng thái đơn': r.orderStatus,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Loi_Nhuan_Theo_Don');
        XLSX.writeFile(wb, `Bao_Cao_Loi_Nhuan_Theo_Don_${todayISODate()}.xlsx`);
        toast.success('Đã xuất file Excel Báo cáo lợi nhuận theo đơn hàng thành công');
      }
      return;
    }

    if (viewMode === 'aggregated') {
      const exportData = aggregatedFlowerRows.map((r, index) => ({
        'STT': index + 1,
        'Mã hoa': r.flowerCode,
        'Tên hoa': r.flowerName,
        'Tên riêng': r.customName || '',
        'Tổng số lượng mua': r.totalQuantity,
        'Đơn giá TB': r.averagePrice,
        'Tổng thành tiền': r.totalAmount,
        'Số đơn đặt': r.orderCount,
        'Tỷ trọng doanh thu (%)': `${r.percentage}%`,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tong_Hop_Hoa_Mua');
      XLSX.writeFile(wb, `Bao_Cao_Hoa_Mua_Tong_Hop_${todayISODate()}.xlsx`);
      toast.success('Đã xuất file Excel bảng tổng hợp hoa mua thành công');
    } else {
      const exportData = allPurchasedItems.map((r, index) => ({
        'STT': index + 1,
        'Ngày đặt': formatDate(r.orderDate),
        'Mã đơn hàng': r.orderCode,
        'NPP / Khách hàng': r.partnerName,
        'Mã hoa': r.flowerCode,
        'Tên hoa': r.flowerName,
        'Tên riêng': r.customName || '',
        'Số lượng mua': r.quantity,
        'Đơn giá': r.unitPrice,
        'Thành tiền': r.amount,
        'Trạng thái đơn': r.orderStatus,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Chi_Tiet_Hoa_Mua');
      XLSX.writeFile(wb, `Bao_Cao_Chi_Tiet_Hoa_Mua_${todayISODate()}.xlsx`);
      toast.success('Đã xuất file Excel chi tiết hoa mua thành công');
    }
  };

  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'nhap':
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
            Nháp
          </span>
        );
      case 'da_xac_nhan':
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Đã xác nhận
          </span>
        );
      case 'dang_giao':
      case 'delivering':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Đang giao
          </span>
        );
      case 'hoan_thanh':
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Hoàn thành
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
            Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* 1. Stat Cards Tổng quan (Bao gồm Doanh số, Chi phí vốn, Lợi nhuận gộp & Tỷ suất sinh lời) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Tổng số đơn hàng"
          value={metrics.total}
          icon={ShoppingCart}
          primary
        />
        <StatCard
          label="Đã hoàn thành"
          value={metrics.completed}
          icon={CheckCircle2}
          colorClass="bg-sky-500/10 text-sky-600 border-sky-200"
        />
        <StatCard
          label="Tổng doanh số bán"
          value={formatNumber(metrics.totalVal)}
          icon={TrendingUp}
          colorClass="bg-purple-500/10 text-purple-600 border-purple-200"
        />
        <StatCard
          label="Tổng giá vốn (Nhập)"
          value={formatNumber(metrics.totalCost)}
          icon={Coins}
          colorClass="bg-amber-500/10 text-amber-600 border-amber-200"
        />
        <StatCard
          label="Tổng lợi nhuận gộp"
          value={`+${formatNumber(metrics.totalProfit)}`}
          icon={TrendingUp}
          colorClass="bg-emerald-500/10 text-emerald-600 border-emerald-200"
        />
        <StatCard
          label="Tỷ suất lợi nhuận"
          value={`${metrics.profitMargin}%`}
          icon={Coins}
          colorClass="bg-teal-500/10 text-teal-600 border-teal-200"
        />
      </div>

      {/* 2. Charts Thống kê & Phân tích sinh lời */}
      {ready && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard
            title="Doanh số theo NPP / Khách hàng (Triệu)"
            icon={<TrendingUp size={15} className="text-primary" />}
          >
            <BarChartBox data={byPartner} seriesName="Triệu" />
          </ChartCard>

          <ChartCard
            title="Top hoa sinh lời cao nhất (Lợi nhuận - Triệu)"
            icon={<Coins size={15} className="text-emerald-600" />}
          >
            <BarChartBox data={topProfitFlowers} seriesName="Triệu LN" />
          </ChartCard>

          <ChartCard
            title="Tình trạng đơn đặt hàng"
            icon={<PackageCheck size={15} className="text-primary" />}
          >
            <BarChartBox data={byStatus} seriesName="Số lượng" layout="vertical" />
          </ChartCard>
        </div>
      )}

      {/* 3. KHỐI BÁO CÁO: BÁN HÀNG & LỢI NHUẬN LỌC THEO NGÀY */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden space-y-4">
        {/* Header khối báo cáo */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              viewMode === 'profit' ? 'bg-emerald-600/10 text-emerald-600' : 'bg-primary/10 text-primary'
            }`}>
              {viewMode === 'profit' ? <TrendingUp size={20} /> : <Flower2 size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{viewMode === 'profit' ? 'Báo cáo Lợi Nhuận & Hiệu Quả Kinh Doanh' : 'Danh sách hoa mua lọc theo ngày'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                  viewMode === 'profit' ? 'bg-emerald-600' : 'bg-primary'
                }`}>
                  {viewMode === 'profit'
                    ? `${profitSubView === 'flower' ? aggregatedProfitRows.length : orderProfitRows.length} mục lợi nhuận`
                    : `${allPurchasedItems.length} lượt mua`}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {viewMode === 'profit'
                  ? 'Đối soát chi tiết doanh thu, chi phí vốn nhập hoa, lợi nhuận gộp và tỷ suất sinh lời theo ngày'
                  : 'Thống kê chi tiết sản lượng hoa, đơn giá và tổng thành tiền theo từng ngày hoặc khoảng thời gian'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-8 gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Download size={13} />
              <span>Xuất Excel (.xlsx)</span>
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-5 pt-0 space-y-4">
          {/* Thanh bộ lọc ngày & khách hàng */}
          <div className="p-3 rounded-xl border border-border/80 bg-background space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Calendar size={13} className="text-primary" /> Lọc nhanh:
                </span>
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 'today', label: 'Hôm nay' },
                    { id: 'yesterday', label: 'Hôm qua' },
                    { id: '7days', label: '7 ngày qua' },
                    { id: 'month', label: 'Tháng này' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      datePreset === p.id
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Có thêm BÁO CÁO LỢI NHUẬN */}
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border text-xs flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('aggregated');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'aggregated'
                      ? 'bg-background text-primary font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers size={12} />
                  <span>Tổng hợp theo hoa ({aggregatedFlowerRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('detailed');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'detailed'
                      ? 'bg-background text-primary font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ListFilter size={12} />
                  <span>Chi tiết từng đơn ({allPurchasedItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('profit');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    viewMode === 'profit'
                      ? 'bg-background text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingUp size={12} className="text-emerald-600" />
                  <span>Báo cáo lợi nhuận ({aggregatedProfitRows.length})</span>
                </button>
              </div>
            </div>

            {/* Date range inputs & Partner filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-border/50 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Từ ngày (dd/mm/yyyy)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                    setPage(1);
                  }}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Đến ngày (dd/mm/yyyy)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                    setPage(1);
                  }}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Lọc theo NPP / Khách hàng
                </label>
                <div className="relative">
                  <select
                    value={selectedPartner}
                    onChange={(e) => {
                      setSelectedPartner(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary text-xs appearance-none truncate pr-6"
                  >
                    <option value="all">Tất cả NPP / Khách hàng</option>
                    {partnerList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <Users size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tìm kiếm hoa / mã hoa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Tên hoa, mã hoa, tên riêng..."
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary text-xs"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Subview toggle khi ở chế độ Báo cáo lợi nhuận */}
          {viewMode === 'profit' && (
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/80 w-fit text-xs">
              <button
                type="button"
                onClick={() => {
                  setProfitSubView('flower');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
                  profitSubView === 'flower'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flower2 size={13} />
                <span>Lợi nhuận theo Loại hoa ({aggregatedProfitRows.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfitSubView('order');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
                  profitSubView === 'order'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingCart size={13} />
                <span>Lợi nhuận theo Đơn hàng ({orderProfitRows.length})</span>
              </button>
            </div>
          )}

          {/* KPI Tóm tắt theo bộ lọc: Chuyển đổi linh hoạt giữa Bán hàng và Lợi nhuận */}
          {viewMode === 'profit' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">1. Tổng doanh số bán</span>
                <span className="text-base font-mono font-bold text-foreground block mt-0.5">
                  {formatNumber(summaryProfitKPI.totalRevenue)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">2. Tổng giá vốn (Nhập hoa)</span>
                <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                  {formatNumber(summaryProfitKPI.totalCost)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block font-bold">3. Tổng lợi nhuận gộp</span>
                <span className="text-base font-mono font-black text-emerald-700 dark:text-emerald-300 block mt-0.5">
                  +{formatNumber(summaryProfitKPI.totalProfit)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">4. Tỷ suất lợi nhuận TB</span>
                <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {summaryProfitKPI.profitMargin}%
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">1. Tổng sản lượng hoa</span>
                <span className="text-base font-mono font-bold text-primary block mt-0.5">
                  {formatNumber(summaryReportKPI.totalQty)} hoa
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">2. Tổng tiền hoa</span>
                <span className="text-base font-mono font-bold text-foreground block mt-0.5">
                  {formatNumber(summaryReportKPI.totalAmount)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">3. Chủng loại hoa</span>
                <span className="text-base font-mono font-bold text-foreground block mt-0.5">
                  {formatNumber(summaryReportKPI.uniqueFlowers)} loại
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <span className="text-[11px] text-muted-foreground block font-medium">4. Đơn hàng liên quan</span>
                <span className="text-base font-mono font-bold text-foreground block mt-0.5">
                  {formatNumber(summaryReportKPI.uniqueOrders)} đơn
                </span>
              </div>
            </div>
          )}

          {/* BẢNG DỮ LIỆU BÁO CÁO */}
          {viewMode === 'profit' ? (
            profitSubView === 'flower' ? (
              /* TAB 3A: BÁO CÁO LỢI NHUẬN THEO LOẠI HOA */
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">STT</th>
                        <th className="py-2.5 px-3 min-w-[85px]">Mã hoa</th>
                        <th className="py-2.5 px-3 min-w-[170px]">Tên hoa</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Tên riêng</th>
                        <th className="py-2.5 px-3 min-w-[95px] text-right">SL bán</th>
                        <th className="py-2.5 px-3 min-w-[105px] text-right">Giá vốn TB</th>
                        <th className="py-2.5 px-3 min-w-[105px] text-right">Giá bán TB</th>
                        <th className="py-2.5 px-3 min-w-[120px] text-right">Tổng tiền vốn</th>
                        <th className="py-2.5 px-3 min-w-[125px] text-right">Doanh thu bán</th>
                        <th className="py-2.5 px-3 min-w-[130px] text-right text-emerald-700 dark:text-emerald-300">Lợi nhuận (Lãi)</th>
                        <th className="py-2.5 px-3 min-w-[95px] text-right">Tỷ suất (%)</th>
                        <th className="py-2.5 px-3 min-w-[90px] text-right">Đóng góp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedProfitFlowers.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-muted-foreground italic">
                            Không tìm thấy dữ liệu lợi nhuận nào trong khoảng ngày đã chọn.
                          </td>
                        </tr>
                      ) : (
                        paginatedProfitFlowers.map((row, index) => {
                          const stt = (page - 1) * pageSize + index + 1;
                          const isProfitPositive = row.totalProfit >= 0;
                          return (
                            <tr key={row.flowerCode + index} className="hover:bg-muted/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{stt}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.flowerCode}</td>
                              <td className="py-2.5 px-3 font-semibold text-foreground">{row.flowerName}</td>
                              <td className="py-2.5 px-3 text-muted-foreground italic">
                                {row.customName ? (
                                  <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[11px] font-medium text-foreground border border-border/60">
                                    {row.customName}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                {formatNumber(row.totalQuantity)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {formatNumber(row.avgCostPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {formatNumber(row.avgUnitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                                {formatNumber(row.totalCost)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                {formatNumber(row.totalRevenue)}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-mono font-bold text-sm ${isProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {isProfitPositive ? '+' : ''}{formatNumber(row.totalProfit)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${isProfitPositive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}`}>
                                  {row.profitMargin}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                                {row.profitShare}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {aggregatedProfitRows.length > 0 && (
                      <tfoot className="bg-muted/40 font-bold border-t-2 border-border text-foreground">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                            Tổng cộng ({aggregatedProfitRows.length} loại hoa):
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-foreground font-bold">
                            {formatNumber(summaryProfitKPI.totalQuantity)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">—</td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">—</td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {formatNumber(summaryProfitKPI.totalCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            {formatNumber(summaryProfitKPI.totalRevenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            +{formatNumber(summaryProfitKPI.totalProfit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                            {summaryProfitKPI.profitMargin}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">100%</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            ) : (
              /* TAB 3B: BÁO CÁO LỢI NHUẬN THEO TỪNG ĐƠN HÀNG */
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">STT</th>
                        <th className="py-2.5 px-3 min-w-[95px]">Ngày đặt</th>
                        <th className="py-2.5 px-3 min-w-[105px]">Mã đơn</th>
                        <th className="py-2.5 px-3 min-w-[160px]">NPP / Khách hàng</th>
                        <th className="py-2.5 px-3 min-w-[95px] text-right">Tổng SL hoa</th>
                        <th className="py-2.5 px-3 min-w-[125px] text-right">Tổng chi phí vốn</th>
                        <th className="py-2.5 px-3 min-w-[125px] text-right">Doanh số đơn hàng</th>
                        <th className="py-2.5 px-3 min-w-[130px] text-right text-emerald-700 dark:text-emerald-300">Lợi nhuận đơn</th>
                        <th className="py-2.5 px-3 min-w-[95px] text-right">Tỷ suất (%)</th>
                        <th className="py-2.5 px-3 min-w-[95px] text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedProfitOrders.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-muted-foreground italic">
                            Không tìm thấy đơn hàng nào trong khoảng ngày đã chọn.
                          </td>
                        </tr>
                      ) : (
                        paginatedProfitOrders.map((row, index) => {
                          const stt = (page - 1) * pageSize + index + 1;
                          const isProfitPositive = row.totalProfit >= 0;
                          return (
                            <tr key={row.orderId + index} className="hover:bg-muted/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{stt}</td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">{formatDate(row.orderDate)}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.orderCode}</td>
                              <td className="py-2.5 px-3 font-medium text-foreground">{row.partnerName}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                {formatNumber(row.totalQuantity)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                                {formatNumber(row.totalCost)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                                {formatNumber(row.totalRevenue)}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-mono font-bold text-sm ${isProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {isProfitPositive ? '+' : ''}{formatNumber(row.totalProfit)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${isProfitPositive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}`}>
                                  {row.profitMargin}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">{renderStatusBadge(row.orderStatus)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {orderProfitRows.length > 0 && (
                      <tfoot className="bg-muted/40 font-bold border-t-2 border-border text-foreground">
                        <tr>
                          <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                            Tổng cộng ({orderProfitRows.length} đơn hàng):
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-foreground font-bold">
                            {formatNumber(summaryProfitKPI.totalQuantity)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                            {formatNumber(summaryProfitKPI.totalCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            {formatNumber(summaryProfitKPI.totalRevenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            +{formatNumber(summaryProfitKPI.totalProfit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                            {summaryProfitKPI.profitMargin}%
                          </td>
                          <td className="py-2.5 px-3 text-center">—</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )
          ) : viewMode === 'aggregated' ? (
            /* TAB 1: TỔNG HỢP THEO LOẠI HOA */
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Mã hoa</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Tên hoa</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Tên riêng</th>
                      <th className="py-2.5 px-3 min-w-[110px] text-right">Tổng SL mua</th>
                      <th className="py-2.5 px-3 min-w-[110px] text-right">Đơn giá TB</th>
                      <th className="py-2.5 px-3 min-w-[125px] text-right">Tổng thành tiền</th>
                      <th className="py-2.5 px-3 min-w-[85px] text-center">Số đơn</th>
                      <th className="py-2.5 px-3 min-w-[90px] text-right">Tỷ trọng (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedAggregated.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground italic">
                          Không tìm thấy mặt hàng hoa nào trong khoảng ngày đã chọn.
                        </td>
                      </tr>
                    ) : (
                      paginatedAggregated.map((row, index) => {
                        const stt = (page - 1) * pageSize + index + 1;
                        return (
                          <tr key={row.flowerCode + index} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{stt}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.flowerCode}</td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">{row.flowerName}</td>
                            <td className="py-2.5 px-3 text-muted-foreground italic">
                              {row.customName ? (
                                <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[11px] font-medium text-foreground border border-border/60">
                                  {row.customName}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              {formatNumber(row.totalQuantity)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {formatNumber(row.averagePrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                              {formatNumber(row.totalAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{row.orderCount}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-mono text-[11px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {row.percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Footer Tổng kết */}
                  {aggregatedFlowerRows.length > 0 && (
                    <tfoot className="bg-muted/40 font-bold border-t-2 border-border text-foreground">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                          Tổng cộng ({aggregatedFlowerRows.length} loại hoa):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                          {formatNumber(summaryReportKPI.totalQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                          {formatNumber(summaryReportKPI.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{summaryReportKPI.uniqueOrders}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            /* TAB 2: CHI TIẾT TỪNG ĐƠN MUA */
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3 min-w-[95px]">Ngày đặt</th>
                      <th className="py-2.5 px-3 min-w-[105px]">ID đơn</th>
                      <th className="py-2.5 px-3 min-w-[160px]">NPP / Khách hàng</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Mã hoa</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Tên hoa & Tên riêng</th>
                      <th className="py-2.5 px-3 min-w-[95px] text-right">SL mua</th>
                      <th className="py-2.5 px-3 min-w-[105px] text-right">Đơn giá</th>
                      <th className="py-2.5 px-3 min-w-[115px] text-right">Thành tiền</th>
                      <th className="py-2.5 px-3 min-w-[95px] text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedDetailed.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-muted-foreground italic">
                          Không tìm thấy mặt hàng hoa nào trong khoảng ngày đã chọn.
                        </td>
                      </tr>
                    ) : (
                      paginatedDetailed.map((row, index) => {
                        const stt = (page - 1) * pageSize + index + 1;
                        return (
                          <tr key={row.orderId + row.flowerCode + index} className="hover:bg-muted/40 transition-colors">
                            <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{stt}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{formatDate(row.orderDate)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.orderCode}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{row.partnerName}</td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.flowerCode}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-foreground block">{row.flowerName}</span>
                              {row.customName && (
                                <span className="text-[11px] text-muted-foreground italic font-normal block mt-0.5">
                                  Tên riêng: {row.customName}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              {formatNumber(row.quantity)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {formatNumber(row.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                              {formatNumber(row.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">{renderStatusBadge(row.orderStatus)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Footer Tổng kết */}
                  {allPurchasedItems.length > 0 && (
                    <tfoot className="bg-muted/40 font-bold border-t-2 border-border text-foreground">
                      <tr>
                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                          Tổng cộng ({allPurchasedItems.length} lượt mua):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                          {formatNumber(summaryReportKPI.totalQty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary font-bold">
                          {formatNumber(summaryReportKPI.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">—</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* Phân trang bảng báo cáo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 text-xs text-muted-foreground">
            <div>
              Hiển thị{' '}
              <strong className="text-foreground">
                {currentTotalRows === 0 ? 0 : Math.min(currentTotalRows, (page - 1) * pageSize + 1)}
              </strong>{' '}
              -{' '}
              <strong className="text-foreground">
                {Math.min(currentTotalRows, page * pageSize)}
              </strong>{' '}
              trên{' '}
              <strong className="text-foreground">{currentTotalRows}</strong>{' '}
              dòng
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 px-1.5 rounded border border-border bg-card text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 px-2 text-xs"
                >
                  Trước
                </Button>
                <span className="px-2 font-mono font-medium text-foreground">
                  {page} / {totalReportPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalReportPages, p + 1))}
                  disabled={page >= totalReportPages}
                  className="h-7 px-2 text-xs"
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
