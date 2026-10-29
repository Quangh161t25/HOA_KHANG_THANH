import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flower2,
  Lock,
  LogIn,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';
import type { Employee } from '@/types/hoaKhangThanh';

export default function LoginPage() {
  const { login, loginAsEmployee } = useAuthStore();
  const { employees } = useEmployeeStore();

  const [credential, setCredential] = useState('khangnv');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      toast.error('Vui lòng nhập Tên đăng nhập, Mã nhân viên hoặc Số điện thoại');
      return;
    }
    if (!password) {
      toast.error('Vui lòng nhập Mật khẩu');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(credential, password);
      setIsLoading(false);
      if (res.success && res.user) {
        toast.success(`Đăng nhập thành công! Chào mừng ${res.user.full_name} (${res.user.position || 'Nhân viên'})`);
      } else {
        toast.error(res.error || 'Đăng nhập không thành công');
      }
    }, 200);
  };

  const handleQuickLogin = (emp: Employee) => {
    loginAsEmployee(emp);
    toast.success(`Đã đăng nhập với tài khoản: ${emp.fullName} (${emp.position})`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/30 to-background flex flex-col justify-center items-center p-4 sm:p-6 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
        <div className="lg:col-span-6 bg-card border border-border/80 rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md">
              <Flower2 size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5">
                <span>HOA KHANG THÀNH</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  ERP
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Hệ thống Quản lý Phân phối Hoa Tươi & Đơn hàng
              </p>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Đăng nhập hệ thống</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đăng nhập bằng tài khoản nhân viên, mã nhân viên hoặc số điện thoại
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Tên đăng nhập */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Tài khoản / Mã NV / SĐT
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="VD: khangnv hoặc NV-001 hoặc 0908123456"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-muted-foreground">Mặc định: 123456</span>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full h-10 pl-9 pr-10 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 mt-2"
            >
              <LogIn size={15} className="stroke-[2.5]" />
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Bảo mật hệ thống Hoa Khang Thành</span>
            </span>
            <span>Phiên bản 2.5</span>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH NHÂN VIÊN ĐĂNG NHẬP NHANH */}
        <div className="lg:col-span-6 bg-card/80 border border-border/80 rounded-2xl shadow-lg p-5 sm:p-6 backdrop-blur space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tài khoản nhân viên có sẵn ({employees.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
              Pass: 123456
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Bấm nút <strong>"Đăng nhập"</strong> bên cạnh bất kỳ nhân viên nào để đăng nhập ngay mà không cần gõ mật khẩu:
          </p>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const isAdmin =
                emp.role === 'admin' ||
                emp.department.includes('Quản trị') ||
                emp.position.includes('Giám đốc') ||
                emp.position.includes('Kế toán trưởng');

              return (
                <div
                  key={emp.id}
                  className="p-2.5 rounded-xl border border-border/70 bg-background/80 hover:border-primary/50 hover:bg-muted/30 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAdmin
                          ? 'bg-primary/15 text-primary border border-primary/20'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {emp.fullName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground truncate">
                          {emp.fullName}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({emp.code})
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                        <span>{emp.position}</span>
                        <span>•</span>
                        <span className="font-mono text-primary font-medium">
                          user: {emp.username || emp.code.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(emp)}
                    className="shrink-0 h-7 px-2.5 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <span>Đăng nhập</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
