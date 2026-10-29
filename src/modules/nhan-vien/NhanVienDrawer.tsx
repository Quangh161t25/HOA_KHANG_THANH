import { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  Coins,
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';
import { useAuthStore } from '@/stores/auth';
import type { Employee } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  mode?: 'create' | 'edit' | 'view';
}

const DEPARTMENTS = [
  'Ban Quản trị',
  'Kinh doanh & Bán sỉ',
  'Cắm hoa & Thiết kế',
  'Kho & Vận hành',
  'Giao nhận & Vận chuyển',
  'Tài chính - Kế toán',
];

const POSITIONS = [
  'Giám đốc Điều hành',
  'Kế toán trưởng',
  'Trưởng phòng Kinh doanh',
  'Chuyên viên Chăm sóc Đại lý',
  'Nghệ nhân Cắm hoa chính',
  'Thợ phụ Cắm hoa',
  'Thủ kho Kho Lạnh',
  'Tài xế Xe lạnh',
  'Nhân viên Đóng thùng',
];

export function NhanVienDrawer({ isOpen, onClose, employee, mode: initialMode = 'create' }: Props) {
  const { addEmployee, updateEmployee, employees } = useEmployeeStore();
  const { loginAsEmployee, user: currentUser } = useAuthStore();

  const [mode, setMode] = useState<'create' | 'edit' | 'view'>(initialMode);
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[1]);
  const [position, setPosition] = useState(POSITIONS[2]);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState(12000000);
  const [status, setStatus] = useState<Employee['status']>('active');

  const isView = mode === 'view';

  useEffect(() => {
    setMode(initialMode);
    setShowPass(false);
    if (employee) {
      setCode(employee.code);
      setFullName(employee.fullName);
      setUsername(employee.username || employee.code.toLowerCase().replace('-', ''));
      setPassword(employee.password || '123456');
      setRole(employee.role || 'member');
      setPhone(employee.phone);
      setEmail(employee.email);
      setDepartment(employee.department);
      setPosition(employee.position);
      setJoinDate(employee.joinDate);
      setSalary(employee.salary);
      setStatus(employee.status);
    } else {
      const nextNum = employees.length + 1;
      const genCode = `NV-${String(nextNum).padStart(3, '0')}`;
      setCode(genCode);
      setFullName('');
      setUsername(`nv${String(nextNum).padStart(3, '0')}`);
      setPassword('123456');
      setRole('member');
      setPhone('');
      setEmail('');
      setDepartment(DEPARTMENTS[1]);
      setPosition(POSITIONS[2]);
      setJoinDate(new Date().toISOString().split('T')[0]);
      setSalary(12000000);
      setStatus('active');
    }
  }, [employee, initialMode, isOpen, employees.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    const payload = {
      code,
      fullName,
      username: username.trim() || code.toLowerCase().replace('-', ''),
      password: password.trim() || '123456',
      role,
      phone,
      email,
      department,
      position,
      joinDate,
      salary,
      status,
    };

    if (mode === 'edit' && employee) {
      updateEmployee(employee.id, payload);
      toast.success(`Đã cập nhật nhân viên ${fullName}`);
    } else {
      addEmployee(payload);
      toast.success(`Đã thêm nhân viên ${fullName}`);
    }

    onClose();
  };

  const handleQuickLogin = (emp: Employee) => {
    loginAsEmployee(emp);
    toast.success(`Đã chuyển sang đăng nhập tài khoản: ${emp.fullName} (${emp.position})`);
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const getStatusBadge = (s: Employee['status']) => {
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Chính thức
          </span>
        );
      case 'probation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Thử việc
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            Nghỉ phép
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            Đã thôi việc
          </span>
        );
    }
  };

  return (
    <Drawer
      title={
        isView
          ? `Hồ sơ: ${employee?.fullName}`
          : mode === 'edit'
            ? `Chỉnh sửa nhân viên: ${employee?.fullName}`
            : 'Thêm mới Nhân viên'
      }
      subtitle={
        isView
          ? `${employee?.code} • ${employee?.department}`
          : 'Quản lý hồ sơ nhân sự, phòng ban và mức lương'
      }
      icon={<Users size={18} />}
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
              <Edit size={14} /> Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit}>
              {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </Button>
          )}
        </div>
      }
    >
      {isView && employee ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {employee.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground truncate">{employee.fullName}</h3>
                  {getStatusBadge(employee.status)}
                </div>
                <p className="text-xs text-muted-foreground">Mã NV: <span className="font-mono font-medium">{employee.code}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Phòng ban</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Briefcase size={14} className="text-primary" />
                  {employee.department}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Chức danh</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User size={14} className="text-primary" />
                  {employee.position}
                </p>
              </div>
            </div>
          </div>

          {/* Account & Password Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound size={14} /> Tài khoản đăng nhập hệ thống
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck size={12} />
                {employee.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-primary/10">
                <span className="text-muted-foreground">Tên đăng nhập (Username):</span>
                <span className="font-mono font-bold text-foreground">
                  {employee.username || employee.code.toLowerCase().replace('-', '')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-primary/10">
                <span className="text-muted-foreground">Mật khẩu đăng nhập:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-foreground tracking-wider">
                    {showPass ? (employee.password || '123456') : '••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                    title={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin(employee)}
                className="w-full gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
              >
                <LogIn size={13} />
                {currentUser?.id === employee.id
                  ? 'Đang đăng nhập bằng tài khoản này'
                  : 'Đăng nhập ngay với tài khoản này'}
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Thông tin liên hệ & Đãi ngộ
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone size={13} /> Số điện thoại
                </span>
                <span className="font-medium text-foreground font-mono">{employee.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail size={13} /> Email liên hệ
                </span>
                <span className="font-medium text-foreground">{employee.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={13} /> Ngày vào làm
                </span>
                <span className="font-medium text-foreground font-mono">{formatDate(employee.joinDate)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Coins size={13} /> Mức lương cơ bản
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                  {formatNumber(employee.salary)} / tháng
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account credentials */}
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound size={13} /> Tài khoản đăng nhập hệ thống
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tên đăng nhập (Username) *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nguyenvana"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mật khẩu đăng nhập *
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (mặc định 123456)"
                    required
                    className="w-full pl-3 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPass ? 'Ẩn' : 'Hiện'}
                  >
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phân quyền</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'member'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Nhân viên tiêu chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    role === 'admin'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  Quản trị viên (Admin)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mã nhân viên *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Số điện thoại *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@hoakhangthanh.vn"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phòng ban *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Chức vụ / Vị trí *</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                list="position-list"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <datalist id="position-list">
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Ngày vào làm</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mức lương cơ bản</label>
              <input
                type="number"
                min={0}
                step={500000}
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Trạng thái làm việc</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: 'active', label: 'Chính thức' },
                  { value: 'probation', label: 'Thử việc' },
                  { value: 'leave', label: 'Nghỉ phép' },
                  { value: 'resigned', label: 'Thôi việc' },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    status === opt.value
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      )}
    </Drawer>
  );
}
