import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  Edit,
  FileSpreadsheet,
  Package,
  Receipt,
  Store,
  Truck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useDebtStore,
  useDistributorStore,
  useSupplierStore,
  useOrderStore,
  useSupplierOrderStore,
} from '@/stores/hoaKhangThanhStore';
import type { DebtDailyRecord } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record?: DebtDailyRecord | null;
  mode?: 'create' | 'edit' | 'view';
  defaultPartnerType?: 'npp' | 'ncc';
}

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

export function CongNoDrawer({
  isOpen,
  onClose,
  record,
  mode: initialMode = 'create',
  defaultPartnerType = 'npp',
}: Props) {
  const { addRecord, updateRecord } = useDebtStore();
  const { distributors } = useDistributorStore();
  const { suppliers } = useSupplierStore();
  const { orders } = useOrderStore();
  const { orders: supplierOrders } = useSupplierOrderStore();

  const [mode, setMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [partnerType, setPartnerType] = useState<'npp' | 'ncc'>(defaultPartnerType);
  const [partnerId, setPartnerId] = useState('');
  const [entryType, setEntryType] = useState<'daily' | 'order'>('daily');
  const [type, setType] = useState<'thu' | 'chi'>('thu');
  const [amount, setAmount] = useState<number>(0);
  const [remainingDebt, setRemainingDebt] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceCode, setReferenceCode] = useState('');
  const [creator, setCreator] = useState('Trần Thị Kim Thành');
  const [notes, setNotes] = useState('');

  const isView = mode === 'view';

  // Partner list according to selected partnerType
  const partnerList = useMemo(() => {
    if (partnerType === 'npp') {
      return distributors.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        phone: d.phone,
        currentDebt: d.finalDebt ?? d.currentDebt ?? 0,
      }));
    }
    return suppliers.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      phone: s.phone,
      currentDebt: s.finalDebt ?? s.totalDebt ?? 0,
    }));
  }, [partnerType, distributors, suppliers]);

  // Selected partner info
  const selectedPartner = useMemo(() => {
    return partnerList.find((p) => p.id === partnerId);
  }, [partnerList, partnerId]);

  // Available orders for linking
  const availableOrders = useMemo(() => {
    if (partnerType === 'npp') {
      return orders.filter(
        (o) => !partnerId || o.distributorId === partnerId || o.distributorName === selectedPartner?.name,
      );
    }
    return supplierOrders.filter(
      (s) => !partnerId || s.supplierId === partnerId || s.supplierName === selectedPartner?.name,
    );
  }, [partnerType, orders, supplierOrders, partnerId, selectedPartner]);

  // Auto calculate default remaining debt based on partner debt +/- amount
  const calculateDefaultRemaining = (
    currentDebt: number,
    txnType: 'thu' | 'chi',
    txnAmount: number,
  ) => {
    if (txnType === 'chi') {
      return currentDebt + txnAmount;
    }
    return Math.max(0, currentDebt - txnAmount);
  };

  useEffect(() => {
    setMode(initialMode);
    if (record) {
      setPartnerType(record.partnerType);
      setPartnerId(record.partnerId);
      setDate(record.date);
      setReferenceCode(record.referenceCode || '');
      setEntryType(
        record.entryType ||
          (record.referenceCode && (record.referenceCode.startsWith('DH-') || record.referenceCode.startsWith('PO-'))
            ? 'order'
            : 'daily'),
      );
      const isThu = record.type === 'thu' || ((record.decreaseAmount || 0) > 0 && (record.increaseAmount || 0) === 0);
      setType(isThu ? 'thu' : 'chi');

      const initialAmt =
        record.amount !== undefined
          ? record.amount
          : isThu
          ? record.decreaseAmount || 0
          : record.increaseAmount || 0;
      setAmount(initialAmt);

      const initialRemDebt =
        record.remainingDebt !== undefined
          ? record.remainingDebt
          : record.finalDebt !== undefined
          ? record.finalDebt
          : (record.oldDebt || 0) + (record.increaseAmount || 0) - (record.decreaseAmount || 0);
      setRemainingDebt(initialRemDebt);

      setCreator(record.creator || 'Trần Thị Kim Thành');
      setNotes(record.notes || '');
    } else {
      setPartnerType(defaultPartnerType);
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setReferenceCode('');
      setEntryType('daily');
      setType('thu');
      setAmount(0);
      setCreator('Trần Thị Kim Thành');
      setNotes('');

      const list = defaultPartnerType === 'npp' ? distributors : suppliers;
      if (list.length > 0) {
        setPartnerId(list[0].id);
        const debt =
          list[0].finalDebt ??
          (defaultPartnerType === 'npp' ? (list[0] as any).currentDebt : (list[0] as any).totalDebt) ??
          0;
        setRemainingDebt(debt);
      } else {
        setPartnerId('');
        setRemainingDebt(0);
      }
    }
  }, [record, initialMode, defaultPartnerType, isOpen, distributors, suppliers]);

  const handlePartnerChange = (newPartnerId: string) => {
    setPartnerId(newPartnerId);
    if (mode === 'create') {
      const p = partnerList.find((item) => item.id === newPartnerId);
      const baseDebt = p?.currentDebt || 0;
      setRemainingDebt(calculateDefaultRemaining(baseDebt, type, amount));
    }
  };

  const handlePartnerTypeChange = (newType: 'npp' | 'ncc') => {
    setPartnerType(newType);
    const list = newType === 'npp' ? distributors : suppliers;
    if (list.length > 0) {
      setPartnerId(list[0].id);
      const debt =
        list[0].finalDebt ?? (newType === 'npp' ? (list[0] as any).currentDebt : (list[0] as any).totalDebt) ?? 0;
      setRemainingDebt(calculateDefaultRemaining(debt, type, amount));
    } else {
      setPartnerId('');
      setRemainingDebt(0);
    }
  };

  const handleTypeChange = (newType: 'thu' | 'chi') => {
    setType(newType);
    const baseDebt = selectedPartner?.currentDebt || 0;
    setRemainingDebt(calculateDefaultRemaining(baseDebt, newType, amount));
  };

  const handleAmountChange = (newAmt: number) => {
    setAmount(newAmt);
    const baseDebt = selectedPartner?.currentDebt || 0;
    setRemainingDebt(calculateDefaultRemaining(baseDebt, type, newAmt));
  };

  const handleOrderSelect = (orderId: string) => {
    if (!orderId) return;
    if (partnerType === 'npp') {
      const ord = orders.find((o) => o.id === orderId);
      if (ord) {
        setReferenceCode(ord.code);
        if (ord.orderDate) setDate(ord.orderDate.split('T')[0]);
        if (ord.distributorId) setPartnerId(ord.distributorId);
        const ordAmt = ord.totalAmount || 0;
        setAmount(ordAmt);
        setType('chi'); // Bán hàng phát sinh nợ
        const p = distributors.find((d) => d.id === ord.distributorId || d.name === ord.distributorName);
        const baseDebt = p ? p.finalDebt ?? p.currentDebt ?? 0 : selectedPartner?.currentDebt || 0;
        setRemainingDebt(baseDebt + ordAmt);
        setNotes(`Theo đơn bán hàng ${ord.code}`);
      }
    } else {
      const ord = supplierOrders.find((s) => s.id === orderId);
      if (ord) {
        setReferenceCode(ord.code);
        if (ord.orderDate) setDate(ord.orderDate.split('T')[0]);
        if (ord.supplierId) setPartnerId(ord.supplierId);
        const ordAmt = ord.totalAmount || 0;
        setAmount(ordAmt);
        setType('chi'); // Nhập hàng phát sinh nợ
        const p = suppliers.find((s) => s.id === ord.supplierId || s.name === ord.supplierName);
        const baseDebt = p ? p.finalDebt ?? p.totalDebt ?? 0 : selectedPartner?.currentDebt || 0;
        setRemainingDebt(baseDebt + ordAmt);
        setNotes(`Theo đơn nhập hàng ${ord.code}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) {
      toast.error('Vui lòng chọn đối tác đối soát công nợ');
      return;
    }
    if (!date) {
      toast.error('Vui lòng chọn ngày ghi nhận');
      return;
    }

    const numAmount = Number(amount) || 0;
    const numRemainingDebt = Number(remainingDebt) || 0;

    const payload: Partial<DebtDailyRecord> = {
      date,
      partnerType,
      partnerId: selectedPartner.id,
      partnerCode: selectedPartner.code,
      partnerName: selectedPartner.name,
      phone: selectedPartner.phone,
      entryType,
      type,
      amount: numAmount,
      remainingDebt: numRemainingDebt,
      // Backward compatibility fields
      oldDebt: selectedPartner.currentDebt || 0,
      increaseAmount: type === 'chi' ? numAmount : 0,
      decreaseAmount: type === 'thu' ? numAmount : 0,
      finalDebt: numRemainingDebt,
      referenceCode: referenceCode.trim() || undefined,
      notes: notes.trim() || undefined,
      creator: creator.trim() || 'Trần Thị Kim Thành',
    };

    if (mode === 'create') {
      addRecord(payload as any);
      toast.success(
        `Đã tạo phiếu công nợ (${entryType === 'order' ? 'Theo đơn' : 'Theo ngày'}) cho ${
          partnerType === 'npp' ? 'NPP' : 'NCC'
        } ${selectedPartner.name}`,
      );
    } else if (mode === 'edit' && record) {
      updateRecord(record.id, payload);
      toast.success('Đã cập nhật bản ghi công nợ thành công');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Drawer
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Receipt size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {mode === 'create'
                ? 'Thêm phát sinh công nợ'
                : mode === 'edit'
                ? 'Chỉnh sửa công nợ'
                : 'Chi tiết bản ghi công nợ'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Theo dõi công nợ theo ngày & theo đơn cho Nhà Phân Phối / Nhà Cung Cấp
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          {isView ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => setMode('edit')}
                className="gap-1.5"
              >
                <Edit size={14} /> Chuyển sang chỉnh sửa
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button type="submit" form="debt-form" className="gap-1.5">
                <Check size={14} /> {mode === 'create' ? 'Tạo bản ghi' : 'Lưu thay đổi'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <form id="debt-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle loại đối tác */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Đối tượng công nợ
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isView || mode === 'edit'}
              onClick={() => handlePartnerTypeChange('npp')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                partnerType === 'npp'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView || mode === 'edit' ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <Store size={15} />
              Nhà Phân Phối (NPP)
            </button>
            <button
              type="button"
              disabled={isView || mode === 'edit'}
              onClick={() => handlePartnerTypeChange('ncc')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                partnerType === 'ncc'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView || mode === 'edit' ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <Truck size={15} />
              Nhà Cung Cấp (NCC)
            </button>
          </div>
        </div>

        {/* Chọn đối tác */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            {partnerType === 'npp' ? 'Chọn Nhà Phân Phối (Đại lý)' : 'Chọn Nhà Cung Cấp (Nhà vườn)'} *
          </label>
          {isView ? (
            <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs">
              <span className="font-bold text-foreground">{record?.partnerName}</span>{' '}
              <span className="text-muted-foreground">({record?.partnerCode})</span>
              {record?.phone && <span className="ml-2 text-primary font-mono">{record.phone}</span>}
            </div>
          ) : (
            <select
              value={partnerId}
              onChange={(e) => handlePartnerChange(e.target.value)}
              className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="" disabled>-- Chọn đối tác --</option>
              {partnerList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name} {p.phone ? `(${p.phone})` : ''} - Nợ hiện tại: {formatNumber(p.currentDebt)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Hình thức ghi: Ghi theo ngày & Ghi theo đơn */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Hình thức ghi nhận
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isView}
              onClick={() => setEntryType('daily')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                entryType === 'daily'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <CalendarDays size={15} />
              📅 Ghi theo ngày
            </button>
            <button
              type="button"
              disabled={isView}
              onClick={() => setEntryType('order')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                entryType === 'order'
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <Package size={15} />
              📦 Ghi theo đơn
            </button>
          </div>
        </div>

        {/* Nếu chọn Ghi theo đơn: cho phép chọn đơn hàng liên kết */}
        {entryType === 'order' && !isView && availableOrders.length > 0 && (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
            <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Package size={14} /> Chọn đơn hàng liên kết để tự động điền thông tin
            </label>
            <select
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            >
              <option value="">-- Chọn đơn hàng ({partnerType === 'npp' ? 'Bán hoa' : 'Nhập hoa'}) --</option>
              {availableOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.code} - {formatDate(ord.orderDate)} - {formatNumber(ord.totalAmount)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Hệ thống tự động điền mã chứng từ, ngày đặt, số tiền đơn hàng và tính lại công nợ còn.
            </p>
          </div>
        )}

        {/* Phân loại: Thu tiền / Chi tiền */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Phân loại phát sinh
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isView}
              onClick={() => handleTypeChange('thu')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                type === 'thu'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <ArrowDownCircle size={16} className={type === 'thu' ? 'text-emerald-600' : ''} />
              ↓ Thu tiền ({partnerType === 'npp' ? 'Thu nợ' : 'Hoàn tiền'})
            </button>
            <button
              type="button"
              disabled={isView}
              onClick={() => handleTypeChange('chi')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                type === 'chi'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              } ${isView ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <ArrowUpCircle size={16} className={type === 'chi' ? 'text-blue-600' : ''} />
              ↑ Chi tiền ({partnerType === 'npp' ? 'Bán hàng nợ' : 'Chi trả NCC'})
            </button>
          </div>
        </div>

        {/* Ngày ghi nhận & Chứng từ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
              <Calendar size={13} className="text-primary" /> Ngày ghi nhận (dd/mm/yyyy) *
            </label>
            {isView ? (
              <div className="p-2.5 bg-muted/40 rounded-lg border border-border text-xs font-mono font-bold text-foreground">
                {formatDate(date)}
              </div>
            ) : (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                required
              />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
              <FileSpreadsheet size={13} className="text-primary" /> Mã đơn hàng / Chứng từ
            </label>
            {isView ? (
              <div className="p-2.5 bg-muted/40 rounded-lg border border-border text-xs font-mono text-foreground">
                {referenceCode || 'Chưa có mã'}
              </div>
            ) : (
              <input
                type="text"
                placeholder={
                  entryType === 'order'
                    ? partnerType === 'npp'
                      ? 'Ví dụ: DH-2026-001'
                      : 'Ví dụ: PO-NCC-001'
                    : 'Ví dụ: PT-001 hoặc PC-001'
                }
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            )}
          </div>
        </div>

        {/* Khối Số tiền & Công nợ còn */}
        <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">
              Số tiền phát sinh & Công nợ còn
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              (Đơn vị: Đồng - Không kèm ký hiệu tiền)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Số tiền */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Số tiền phát sinh *
              </label>
              {isView ? (
                <div className="p-2.5 bg-card rounded-lg border border-border text-sm font-mono font-extrabold text-foreground">
                  {formatNumber(amount)}
                </div>
              ) : (
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-sm rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold"
                    required
                  />
                  {amount > 0 && (
                    <p className="text-[11px] text-muted-foreground font-mono mt-1">
                      Hiển thị: <span className="font-bold text-foreground">{formatNumber(amount)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Công nợ còn */}
            <div>
              <label className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 block">
                Công nợ còn (Cột ảo tự động tính theo ngày)
              </label>
              <div className="p-2.5 bg-card rounded-lg border border-border flex items-center justify-between">
                <div>
                  <span
                    className={`text-sm font-mono font-extrabold ${
                      remainingDebt > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {remainingDebt < 0
                      ? `Dư: ${formatNumber(Math.abs(remainingDebt))}`
                      : formatNumber(remainingDebt)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Nợ đối tác trước: {formatNumber(selectedPartner?.currentDebt || 0)}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                  Cột ảo tự động tính
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Người lập & Ghi chú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
              <User size={13} className="text-primary" /> Người lập phiếu
            </label>
            {isView ? (
              <div className="p-2 bg-muted/40 rounded-lg border border-border text-xs text-foreground">
                {creator}
              </div>
            ) : (
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
              <Building2 size={13} className="text-primary" /> Diễn giải chi tiết / Ghi chú
            </label>
            {isView ? (
              <div className="p-2 bg-muted/40 rounded-lg border border-border text-xs text-foreground">
                {notes || 'Không có ghi chú'}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Ghi chú về lô hoa, phương thức chuyển khoản..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-input bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>
        </div>

        {/* Nếu là bản ghi tổng hợp theo ngày: hiển thị danh sách các đơn hàng & phát sinh trong ngày */}
        {record?.childRecords && record.childRecords.length > 0 && (
          <div className="p-3.5 bg-card rounded-xl border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Package size={14} className="text-primary" />
                Chi tiết các đơn hàng & phát sinh trong ngày ({record.childRecords.length})
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Tổng hợp đối soát ngày
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2 px-2.5">Mã đơn / Chứng từ</th>
                    <th className="py-2 px-2.5">Loại</th>
                    <th className="py-2 px-2.5 text-right">Số tiền</th>
                    <th className="py-2 px-2.5">Người lập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {record.childRecords.map((item, idx) => {
                    const itemThu =
                      item.type === 'thu' ||
                      ((item.decreaseAmount || 0) > 0 && (item.increaseAmount || 0) === 0);
                    const itemAmt =
                      item.amount !== undefined
                        ? item.amount
                        : itemThu
                        ? item.decreaseAmount || 0
                        : item.increaseAmount || 0;
                    return (
                      <tr key={item.id || idx} className="hover:bg-muted/30">
                        <td className="py-2 px-2.5 font-mono font-bold text-foreground">
                          {item.referenceCode || 'Phát sinh'}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              itemThu
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {itemThu ? 'Thu tiền' : 'Chi (Bán hoa)'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-right text-foreground">
                          {formatNumber(itemAmt)}
                        </td>
                        <td className="py-2 px-2.5 text-muted-foreground">{item.creator || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
}
