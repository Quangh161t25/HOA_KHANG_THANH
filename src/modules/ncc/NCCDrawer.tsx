import { useEffect, useState } from 'react';
import { Mail, MapPin, Phone, Star, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useSupplierStore } from '@/stores/hoaKhangThanhStore';
import type { Supplier } from '@/types/hoaKhangThanh';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  mode?: 'create' | 'edit' | 'view';
}

export function NCCDrawer({ isOpen, onClose, supplier, mode = 'create' }: Props) {
  const { addSupplier, updateSupplier, suppliers } = useSupplierStore();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [rating, setRating] = useState(5);
  const [oldDebt, setOldDebt] = useState(0);
  const [importAmount, setImportAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [status, setStatus] = useState<Supplier['status']>('active');
  const [notes, setNotes] = useState('');

  const isView = mode === 'view';
  const finalDebt = (oldDebt || 0) + (importAmount || 0) - (paidAmount || 0);

  useEffect(() => {
    if (supplier) {
      setCode(supplier.code);
      setName(supplier.name);
      setContactPerson(supplier.contactPerson);
      setPhone(supplier.phone);
      setEmail(supplier.email);
      setAddress(supplier.address);
      setSpecialties(supplier.specialties.join(', '));
      setRating(supplier.rating);
      setOldDebt(supplier.oldDebt || 0);
      setImportAmount(supplier.importAmount || 0);
      setPaidAmount(supplier.paidAmount || 0);
      setStatus(supplier.status);
      setNotes(supplier.notes || '');
    } else {
      const nextNum = suppliers.length + 1;
      setCode(`NCC-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setSpecialties('Hoa hồng, Hoa ly');
      setRating(5);
      setOldDebt(0);
      setImportAmount(0);
      setPaidAmount(0);
      setStatus('active');
      setNotes('');
    }
  }, [supplier, isOpen, suppliers.length, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specs = specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (supplier && mode === 'edit') {
      updateSupplier(supplier.id, {
        code,
        name,
        contactPerson,
        phone,
        email,
        address,
        specialties: specs,
        rating,
        oldDebt,
        importAmount,
        paidAmount,
        finalDebt,
        totalDebt: finalDebt,
        status,
        notes,
      });
      toast.success(`Đã cập nhật nhà cung cấp ${name}`);
    } else {
      addSupplier({
        code,
        name,
        contactPerson,
        phone,
        email,
        address,
        specialties: specs,
        rating,
        oldDebt,
        importAmount,
        paidAmount,
        finalDebt,
        totalDebt: finalDebt,
        status,
        notes,
      });
      toast.success(`Đã thêm nhà cung cấp ${name}`);
    }
    onClose();
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  return (
    <Drawer
      title={isView ? `Chi tiết Nhà cung cấp ${supplier?.name}` : supplier ? 'Chỉnh sửa Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}
      subtitle={isView ? `Mã: ${supplier?.code} • ${supplier?.address}` : 'Quản lý thông tin nhà vườn, hợp tác xã cung ứng'}
      icon={<Truck size={18} />}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose}>
            {isView ? 'Đóng' : 'Hủy bỏ'}
          </Button>
          {!isView && (
            <Button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground">
              {supplier ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          )}
        </div>
      }
    >
      {isView && supplier ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {supplier.code}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Star size={12} className="fill-amber-500" />
                {supplier.rating} sao
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{supplier.name}</h3>
            <p className="text-xs text-muted-foreground">{supplier.notes || 'Chưa có ghi chú hợp tác.'}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Người đại diện:</span>
              <span className="font-semibold text-foreground">{supplier.contactPerson}</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Số điện thoại:</span>
              <a href={`tel:${supplier.phone}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                <Phone size={13} /> {supplier.phone}
              </a>
            </div>
            {supplier.email && (
              <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold text-foreground flex items-center gap-1"><Mail size={13} /> {supplier.email}</span>
              </div>
            )}
            <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
              <span className="text-muted-foreground">Địa chỉ vườn:</span>
              <span className="font-semibold text-foreground flex items-center gap-1 text-right max-w-[240px]"><MapPin size={13} className="shrink-0" /> {supplier.address}</span>
            </div>
            {/* Thống kê công nợ & giao dịch */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block pb-1 border-b border-border/60">
                Đối soát công nợ NCC
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Công nợ cũ:</span>
                  <span className="font-semibold text-foreground">{formatNumber(supplier.oldDebt || 0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Tiền nhập hoa:</span>
                  <span className="font-bold text-foreground">{formatNumber(supplier.importAmount || 0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Tiền trả NCC:</span>
                  <span className="font-bold text-emerald-600">{formatNumber(supplier.paidAmount || 0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Công nợ cuối:</span>
                  <span className={`font-extrabold ${(supplier.finalDebt ?? supplier.totalDebt) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatNumber(supplier.finalDebt !== undefined ? supplier.finalDebt : (supplier.oldDebt || 0) + (supplier.importAmount || 0) - (supplier.paidAmount || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">Hoa chủ lực cung cấp:</span>
            <div className="flex flex-wrap gap-1.5">
              {supplier.specialties.map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mã NCC
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
                Tình trạng hợp tác
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Supplier['status'])}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              >
                <option value="active">Đang hợp tác</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên Nhà cung cấp / Nhà vườn
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Trang trại Hoa Hasfarm Đà Lạt"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Người liên hệ đại diện
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Nguyễn Văn Toàn"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0913 xxx xxx"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ncc@domain.vn"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Đánh giá (1-5 sao)</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value) || 5)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Địa chỉ vườn / kho bãi</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Đường Vạn Hạnh, Phường 8, Đà Lạt..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Hoa chủ lực cung cấp (cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Hoa hồng, Hoa ly, Cẩm chướng..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl border border-border bg-muted/20 space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Thông tin công nợ & Nhập hàng
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Công nợ cũ
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={oldDebt || ''}
                    placeholder="0"
                    onChange={(e) => setOldDebt(parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono font-medium text-foreground text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tiền nhập hoa
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={importAmount || ''}
                    placeholder="0"
                    onChange={(e) => setImportAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-foreground text-right"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tiền trả NCC
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={paidAmount || ''}
                    placeholder="0"
                    onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-emerald-600 text-right"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs font-bold text-foreground">
                  Công nợ cuối = Nợ cũ + Nhập hoa - Trả NCC:
                </span>
                <span className={`text-sm font-mono font-extrabold ${finalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatNumber(finalDebt)}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Ghi chú & đánh giá</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Giao xe lạnh 4h sáng..."
                className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground"
              />
            </div>
          </div>
        </form>
      )}
    </Drawer>
  );
}
