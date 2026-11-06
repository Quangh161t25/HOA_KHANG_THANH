import { useEffect, useState } from 'react';
import { Flower2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useFlowerStore } from '@/stores/hoaKhangThanhStore';
import type { Flower } from '@/types/hoaKhangThanh';
import {
  parseAliases,
  validateFlowerAliases,
  validateFlowerName,
} from '@/lib/flowerValidation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  flower?: Flower | null;
  mode?: 'view' | 'edit' | 'create';
}

const CATEGORIES = ['Hoa hồng', 'Hoa ly', 'Hoa lan', 'Hoa cúc', 'Hoa cành', 'Hoa nhập khẩu', 'Hoa phụ'];
const UNITS = ['Cành', 'Bó (5 cành)', 'Bó (10 cành)', 'Bó (20 cành)', 'Bó (500g)', 'Bó (300g)', 'Chậu', 'Thùng'];
const ORIGINS = ['Đà Lạt (Hasfarm)', 'Đà Lạt', 'Đơn Dương, Lâm Đồng', 'Mê Linh, Hà Nội', 'Sa Đéc, Đồng Tháp', 'Nhập khẩu Hà Lan', 'Nhập khẩu Ecuador', 'Côn Minh (TQ)'];

export function HoaDrawer({ isOpen, onClose, flower, mode = 'create' }: Props) {
  const { addFlower, updateFlower, flowers } = useFlowerStore();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [origin, setOrigin] = useState('');
  const [color, setColor] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [status, setStatus] = useState<Flower['status']>('active');
  const [description, setDescription] = useState('');

  const isView = mode === 'view';

  useEffect(() => {
    if (flower) {
      setCode(flower.code);
      setName(flower.name);
      setCustomName(flower.customName || '');
      setCategory(flower.category === 'Khác' ? '' : (flower.category || ''));
      setUnit(flower.unit || '');
      setOrigin(flower.origin === 'Đà Lạt' ? '' : (flower.origin || ''));
      setColor(flower.color === 'Đa sắc' ? '' : (flower.color || ''));
      setCostPrice(flower.costPrice || 0);
      setWholesalePrice(flower.wholesalePrice || 0);
      setStock((flower.stock === 100 || flower.stock === 200) ? 0 : (flower.stock || 0));
      setStatus(flower.status || 'active');
      setDescription(flower.description || '');
    } else {
      const nextNum = flowers.length + 1;
      setCode(`HOA-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setCustomName('');
      setCategory('');
      setUnit('');
      setOrigin('');
      setColor('');
      setCostPrice(0);
      setWholesalePrice(0);
      setStock(0);
      setStatus('active');
      setDescription('');
    }
  }, [flower, isOpen, flowers.length, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim() || `Hoa mới ${code || Date.now()}`;

    // 1. Kiểm tra tính hợp lệ và chống trùng tên hoa nếu có nhập tên
    if (name.trim()) {
      const nameCheck = validateFlowerName(finalName, flower?.id, flowers);
      if (!nameCheck.isValid) {
        toast.error(nameCheck.error);
        return;
      }
    }

    // 2. Kiểm tra tính hợp lệ và chống trùng tên riêng (kể cả chữ hoa chữ thường)
    const aliasCheck = validateFlowerAliases(customName, flower?.id, flowers, finalName);
    if (!aliasCheck.isValid) {
      toast.error(aliasCheck.error);
      return;
    }

    const finalCustomName = aliasCheck.cleanedCustomName;

    if (flower && mode === 'edit') {
      updateFlower(flower.id, {
        code,
        name: finalName,
        customName: finalCustomName,
        category,
        unit,
        origin,
        color,
        costPrice,
        wholesalePrice,
        stock,
        status,
        description,
      });
      toast.success(`Đã cập nhật hoa ${finalName}`);
    } else {
      addFlower({
        code,
        name: finalName,
        customName: finalCustomName,
        category,
        unit,
        origin,
        color,
        costPrice,
        wholesalePrice,
        stock,
        status,
        description,
      });
      toast.success(`Đã thêm mới hoa ${finalName}`);
    }
    onClose();
  };

  const flowerAliases = isView && flower ? parseAliases(flower.customName) : [];

  return (
    <Drawer
      title={isView ? `Chi tiết hoa ${flower?.name}` : flower ? 'Chỉnh sửa giống hoa' : 'Thêm mới giống hoa tươi'}
      subtitle={isView ? `Mã: ${flower?.code} • ${flower?.origin}` : 'Thông tin phân loại, đơn vị tính và xuất xứ'}
      icon={<Flower2 size={18} />}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {isView ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {!isView && (
            <Button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground">
              {flower ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          )}
        </div>
      }
    >
      {isView && flower ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-primary/10 text-primary">
                {flower.code}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {flower.status === 'active' ? 'Đang kinh doanh' : 'Tạm hết'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{flower.name}</h3>

            {/* Danh sách tên riêng (cách nhau dấu ,) */}
            {flowerAliases.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} className="text-primary" /> Tên riêng ({flowerAliases.length} tên gọi):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {flowerAliases.map((alias, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Chưa có tên riêng.</p>
            )}

            <p className="text-xs text-muted-foreground pt-1">{flower.description || 'Chưa có mô tả đặc điểm.'}</p>
          </div>

          {/* Bảng thuộc tính hoa - KHÔNG CÓ GIÁ */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Chủng loại:</span>
              <span className="font-semibold text-foreground">{flower.category}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Đơn vị tính:</span>
              <span className="font-semibold text-foreground">{flower.unit}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Xuất xứ / Vườn:</span>
              <span className="font-semibold text-foreground">{flower.origin}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Màu sắc:</span>
              <span className="font-semibold text-foreground">{flower.color}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tồn kho hiện tại:</span>
            <span className="text-base font-extrabold text-foreground">{flower.stock.toLocaleString('vi-VN')} {flower.unit}</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mã hoa
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Chủng loại
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="">-- Chưa chọn chủng loại --</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên hoa tươi
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Hoa Hồng Red Naomi Đà Lạt"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                * Tên hoa không được trùng nhau giữa các giống hoa (kể cả chữ hoa chữ thường).
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên riêng (Nhiều tên cách nhau dấu phẩy ",")
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="VD: Lan tím, Hồ điệp tím, Lan tím đại..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                * Mỗi người có thể tự đặt một hoặc nhiều tên riêng cách nhau bởi dấu phẩy (,). Các tên riêng không được trùng nhau (kể cả chữ hoa chữ thường).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Đơn vị tính</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="">-- Chưa chọn đơn vị tính --</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Màu sắc</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Đỏ nhung, vàng..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Xuất xứ / Vườn trồng</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="">-- Chưa chọn xuất xứ --</option>
                {ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Tình trạng kinh doanh</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Flower['status'])}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="active">Đang kinh doanh</option>
                <option value="out_of_stock">Tạm hết hàng</option>
                <option value="discontinued">Ngừng bán</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Số lượng tồn kho ban đầu</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Mô tả đặc điểm & cách chăm sóc</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Hoa cành dài 70-80cm, bảo quản mát 6-8°C..."
                className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>
        </form>
      )}
    </Drawer>
  );
}
