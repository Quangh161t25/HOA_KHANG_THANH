import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Boxes } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useFlowerStore,
  useInventoryStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import type { InventoryItem } from '@/types/hoaKhangThanh';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem?: InventoryItem | null;
  defaultType?: 'import' | 'export' | 'view';
}

const WAREHOUSES = [
  'Kho Lạnh A (Đà Lạt)',
  'Kho Lạnh B (Nhập Khẩu)',
  'Kho Mát Trưng Bày',
  'Kho Sảnh Trung Chuyển',
];

export function TonKhoDrawer({ isOpen, onClose, inventoryItem, defaultType = 'import' }: Props) {
  const { flowers } = useFlowerStore();
  const { suppliers } = useSupplierStore();
  const { importStock, exportStock } = useInventoryStore();

  const [mode, setMode] = useState<'import' | 'export' | 'view'>(defaultType);
  const [flowerId, setFlowerId] = useState(inventoryItem?.flowerId || flowers[0]?.id || '');
  const [quantity, setQuantity] = useState(100);
  const [warehouse, setWarehouse] = useState(inventoryItem?.warehouse || WAREHOUSES[0]);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [unitPrice, setUnitPrice] = useState(inventoryItem?.costPrice || 5000);
  const [reason, setReason] = useState<'order' | 'damage' | 'adjust'>('damage');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentFlower = flowers.find((f) => f.id === flowerId) || flowers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFlower) return;

    if (mode === 'import') {
      const sup = suppliers.find((s) => s.id === supplierId);
      importStock(currentFlower.id, quantity, warehouse, unitPrice, sup?.name);
      toast.success(
        `Đã nhập thêm ${quantity} ${currentFlower.unit} "${currentFlower.name}" vào ${warehouse}`,
      );
    } else {
      if (quantity > currentFlower.stock) {
        toast.error(`Số lượng xuất vượt quá tồn kho hiện tại (${currentFlower.stock})`);
        return;
      }
      exportStock(currentFlower.id, quantity, reason, notes);
      toast.success(`Đã xuất kho ${quantity} ${currentFlower.unit} "${currentFlower.name}"`);
    }

    onClose();
  };

  const isView = mode === 'view';

  return (
    <Drawer
      title={
        isView
          ? `Chi tiết tồn kho ${inventoryItem?.flowerName}`
          : mode === 'import'
            ? 'Phiếu Nhập kho hoa tươi'
            : 'Phiếu Xuất kho / Hủy hao hụt'
      }
      subtitle={
        isView
          ? `Mã: ${inventoryItem?.flowerCode} • ${inventoryItem?.warehouse}`
          : 'Cập nhật số lượng kiểm kê kho lạnh thực tế'
      }
      icon={<Boxes size={18} />}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {isView ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {!isView && (
            <Button
              type="button"
              onClick={handleSubmit}
              className={mode === 'import' ? 'bg-primary text-primary-foreground' : 'bg-rose-600 text-white'}
            >
              {mode === 'import' ? 'Xác nhận nhập kho' : 'Xác nhận xuất kho'}
            </Button>
          )}
        </div>
      }
    >
      {isView && inventoryItem ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                {inventoryItem.flowerCode}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  inventoryItem.currentStock <= inventoryItem.minStock
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {inventoryItem.currentStock <= inventoryItem.minStock ? 'Cần nhập thêm' : 'Mức an toàn'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{inventoryItem.flowerName}</h3>
            <p className="text-xs text-muted-foreground">{inventoryItem.freshness}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Kho lưu trữ:</span>
              <span className="font-semibold text-foreground">{inventoryItem.warehouse}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Tồn kho hiện tại:</span>
              <span className="font-extrabold text-foreground text-sm">{inventoryItem.currentStock} {inventoryItem.unit}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Ngưỡng an toàn tối thiểu:</span>
              <span className="font-semibold text-foreground">{inventoryItem.minStock} {inventoryItem.unit}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-muted-foreground block mb-0.5">Hạn bảo quản:</span>
              <span className="font-semibold text-foreground">{inventoryItem.shelfLifeDays} ngày</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              onClick={() => setMode('import')}
              className="flex-1 gap-1 text-xs bg-primary text-primary-foreground"
            >
              <ArrowDownLeft size={14} /> Nhập thêm vào kho này
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode('export')}
              className="flex-1 gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <ArrowUpRight size={14} /> Xuất / Hủy dập nát
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setMode('import')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'import' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft size={16} /> Nhập kho mới
            </button>
            <button
              type="button"
              onClick={() => setMode('export')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'export' ? 'bg-rose-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight size={16} /> Xuất kho / Hủy dập
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Chọn loại hoa <span className="text-rose-500">*</span>
            </label>
            <select
              value={flowerId}
              onChange={(e) => {
                setFlowerId(e.target.value);
                const fl = flowers.find((f) => f.id === e.target.value);
                if (fl) setUnitPrice(fl.costPrice);
              }}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {flowers.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.code} - {fl.name} (Tồn hiện tại: {fl.stock} {fl.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Số lượng {mode === 'import' ? 'nhập' : 'xuất'} ({currentFlower?.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Kho lưu trữ bảo quản</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'import' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nhà cung cấp / Vườn</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Đơn giá vốn (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Lý do xuất kho</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as 'damage')}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="damage">Xuất hủy do dập nát, gãy cành, tàn úa</option>
                <option value="adjust">Điều chỉnh kiểm kê kho định kỳ</option>
                <option value="order">Xuất bán trực tiếp tại vựa sỉ</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Ghi chú kiểm tra chất lượng</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú đánh giá độ tươi, xuất xứ lô hàng..."
              className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
        </form>
      )}
    </Drawer>
  );
}
