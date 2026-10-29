import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Edit, Wallet, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useCashStore, useFixedExpenseStore } from '@/stores/hoaKhangThanhStore';
import type { CashTransaction } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction?: CashTransaction | null;
  mode?: 'create' | 'edit' | 'view';
  defaultType?: 'income' | 'expense';
}

const INCOME_CATEGORIES = [
  'Thu tiền bán hoa sỉ',
  'Thu hồi công nợ đại lý',
  'Thu bán hoa lẻ tại sảnh',
  'Thu tiền cọc đơn hàng',
  'Thu khác',
];

const EXPENSE_CATEGORIES = [
  'Chi nhập hoa từ NCC',
  'Chi lương nhân viên',
  'Chi tiền điện & bảo trì kho lạnh',
  'Chi phí vận chuyển & xăng dầu xe lạnh',
  'Chi mua phụ liệu cắm hoa & bao bì',
  'Chi thuê mặt bằng & vựa hoa',
  'Chi tiếp khách & kinh doanh',
  'Chi khác',
];

const PAYMENT_METHODS: CashTransaction['paymentMethod'][] = [
  'Tiền mặt',
  'Chuyển khoản Vietcombank',
  'Chuyển khoản MB Bank',
  'Chuyển khoản VietinBank',
];

export function ThuChiDrawer({ isOpen, onClose, transaction, mode: initialMode = 'create', defaultType = 'income' }: Props) {
  const { addTransaction, updateTransaction } = useCashStore();
  const { presets } = useFixedExpenseStore();

  const [mode, setMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [amount, setAmount] = useState(10000000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<CashTransaction['paymentMethod']>(PAYMENT_METHODS[1]);
  const [partner, setPartner] = useState('');
  const [creator, setCreator] = useState('Trần Thị Kim Thành');
  const [notes, setNotes] = useState('');

  const isView = mode === 'view';

  useEffect(() => {
    setMode(initialMode);
    if (transaction) {
      setCode(transaction.code);
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(transaction.amount);
      setDate(transaction.date);
      setPaymentMethod(transaction.paymentMethod);
      setPartner(transaction.partner);
      setCreator(transaction.creator);
      setNotes(transaction.notes || '');
    } else {
      const isExp = defaultType === 'expense';
      setType(isExp ? 'expense' : 'income');
      setCode(`${isExp ? 'PC' : 'PT'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(isExp ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
      setAmount(5000000);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(PAYMENT_METHODS[1]);
      setPartner('');
      setCreator('Trần Thị Kim Thành');
      setNotes('');
    }
  }, [transaction, defaultType, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCode(`${newType === 'income' ? 'PT' : 'PC'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner.trim()) {
      toast.error('Vui lòng nhập đối tượng người nộp / nhận tiền');
      return;
    }
    if (amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }

    if (mode === 'edit' && transaction) {
      updateTransaction(transaction.id, {
        code,
        type,
        category,
        amount,
        date,
        paymentMethod,
        partner,
        creator,
        notes,
      });
      toast.success(`Đã cập nhật phiếu ${code}`);
    } else {
      addTransaction({
        code,
        type,
        category,
        amount,
        date,
        paymentMethod,
        partner,
        creator,
        notes,
      });
      toast.success(`Đã lưu phiếu ${code} số tiền ${amount.toLocaleString('vi-VN')}`);
    }

    onClose();
  };

  const formatNumber = (num?: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  return (
    <Drawer
      title={
        isView
          ? `Chi tiết phiếu ${transaction?.code}`
          : mode === 'edit'
            ? `Chỉnh sửa phiếu ${transaction?.code}`
            : type === 'income'
              ? 'Lập Phiếu Thu Tiền'
              : 'Lập Phiếu Chi Tiền'
      }
      subtitle={
        isView
          ? `${transaction?.category} • ${formatDate(transaction?.date)}`
          : 'Ghi nhận dòng tiền thu vào hoặc chi ra vào sổ quỹ'
      }
      icon={<Wallet size={18} />}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {isView ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {isView ? (
            <Button
              type="button"
              onClick={() => setMode('edit')}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit size={14} /> Chỉnh sửa phiếu
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className={type === 'income' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-600 text-white hover:bg-rose-700'}
            >
              {type === 'income' ? 'Lưu Phiếu Thu' : 'Lưu Phiếu Chi'}
            </Button>
          )}
        </div>
      }
    >
      {isView && transaction ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-muted text-foreground">
                {transaction.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  transaction.type === 'income'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {transaction.type === 'income' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                {transaction.type === 'income' ? 'Phiếu Thu' : 'Phiếu Chi'}
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              {transaction.type === 'income' ? '+' : '-'}{formatNumber(transaction.amount)}
            </div>
            <p className="text-xs text-muted-foreground">{transaction.category}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Ngày ghi sổ:</span>
              <span className="font-semibold text-foreground font-mono">{formatDate(transaction.date)}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Hình thức thanh toán:</span>
              <span className="font-semibold text-foreground">{transaction.paymentMethod}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Đối tượng liên quan:</span>
              <span className="font-semibold text-foreground">{transaction.partner}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Người lập phiếu:</span>
              <span className="font-semibold text-foreground">{transaction.creator}</span>
            </div>
            {transaction.notes && (
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-muted-foreground block mb-1">Nội dung ghi chú:</span>
                <p className="text-foreground italic">{transaction.notes}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft size={16} /> Phiếu Thu (Tiền vào)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight size={16} /> Phiếu Chi (Tiền ra)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Mã phiếu</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Ngày ghi sổ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
                required
              />
            </div>
          </div>

          {type === 'expense' && presets.length > 0 && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-600" /> Nút chi phí cố định (Điền nhanh):
                </span>
                <span className="text-[10px] text-muted-foreground">Bấm để tự động điền</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCategory(p.category);
                      setAmount(p.amount);
                      setPaymentMethod(p.paymentMethod);
                      if (!partner || partner === 'Nội bộ / Tài xế') setPartner('Nội bộ / Tài xế');
                      setNotes(p.notes || `Chi tiền ${p.name}`);
                      toast.info(`Đã áp dụng mẫu chi "${p.name}": ${formatNumber(p.amount)}`);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-card hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-foreground flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <span>{p.name}:</span>
                    <span className="font-mono font-extrabold text-rose-600">{formatNumber(p.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Danh mục nghiệp vụ <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
            >
              {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Số tiền giao dịch (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1000"
              step="500000"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className={`w-full h-10 px-3 rounded-lg border border-border bg-background text-base font-extrabold focus:outline-none focus:ring-2 ${
                type === 'income' ? 'text-emerald-600 focus:ring-emerald-500/20' : 'text-rose-600 focus:ring-rose-500/20'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as CashTransaction['paymentMethod'])}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Người lập phiếu</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Đối tượng {type === 'income' ? 'nộp tiền (Đại lý / Khách)' : 'nhận tiền (NCC / Nhân viên)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="VD: Chuỗi Shop Hoa FlowerBox hoặc Trang trại Hasfarm..."
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Nội dung ghi chú diễn giải</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mục đích thu chi..."
              className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground"
            />
          </div>
        </form>
      )}
    </Drawer>
  );
}
