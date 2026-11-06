import { useState } from 'react';
import { Check, Plus, Trash2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useFixedExpenseStore } from '@/stores/hoaKhangThanhStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const EXPENSE_CATEGORIES = [
  'Chi phí vận chuyển & xăng dầu xe lạnh',
  'Chi mua phụ liệu cắm hoa & bao bì',
  'Chi tiếp khách & kinh doanh',
  'Chi tiền điện & bảo trì kho lạnh',
  'Chi thuê mặt bằng & vựa hoa',
  'Chi nhập hoa từ NCC',
  'Chi lương nhân viên',
  'Chi khác',
];

export function FixedExpenseModal({ isOpen, onClose }: Props) {
  const { presets, addPreset, deletePreset } = useFixedExpenseStore();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Chi phí nhanh';
    const finalAmount = Number(amount) || 0;

    addPreset({
      name: finalName,
      amount: finalAmount,
      category,
      paymentMethod: 'Tiền mặt',
      notes: notes.trim() || `Chi tiền ${finalName}`,
      icon: 'zap',
    });

    toast.success(`Đã thêm nút chi phí cố định "${finalName}" (${formatNumber(finalAmount)})`);
    setName('');
    setAmount(50000);
    setNotes('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, presetName: string) => {
    if (confirm(`Bạn có chắc muốn xóa nút chi phí "${presetName}"?`)) {
      deletePreset(id);
      toast.success(`Đã xóa nút chi phí "${presetName}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Quản lý Nút Chi Phí Cố Định Nhanh
              </h3>
              <p className="text-xs text-muted-foreground">
                Thêm hoặc xóa các nút chi tiêu thường xuyên để bấm 1 click ghi sổ ngay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Danh sách các nút hiện tại */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 text-xs"
            >
              <div>
                <span className="font-bold text-foreground block">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">{p.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold text-rose-600 text-sm">
                  {formatNumber(p.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Xóa nút này"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form thêm nút mới */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Plus size={14} /> Thêm nút chi phí cố định mới
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-foreground mb-1 block">
                  Tên nút (VD: Xăng xe, Cơm ca)
                </label>
                <input
                  type="text"
                  placeholder="VD: Xăng xe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs h-8 px-2.5 rounded-lg border border-input bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground mb-1 block">
                  Số tiền cố định
                </label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="50000"
                  className="w-full text-xs h-8 px-2.5 rounded-lg border border-input bg-card font-mono text-foreground font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground mb-1 block">
                Hạng mục chi
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs h-8 px-2.5 rounded-lg border border-input bg-card text-foreground"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-foreground mb-1 block">
                Diễn giải mặc định
              </label>
              <input
                type="text"
                placeholder="VD: Đổ xăng xe máy giao hàng"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs h-8 px-2.5 rounded-lg border border-input bg-card text-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-7 text-xs"
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs gap-1">
                <Check size={13} /> Lưu nút mới
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full text-xs gap-1.5 h-8 border-dashed text-primary hover:bg-primary/5"
          >
            <Plus size={14} /> Thêm nút chi phí cố định khác
          </Button>
        )}

        <div className="flex justify-end pt-2 border-t border-border/60">
          <Button type="button" onClick={onClose} size="sm" className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
