import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Flower2,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const { login } = useAuthStore();

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
    try {
      const res = await login(credential, password);
      if (res.success && res.user) {
        toast.success(`Đăng nhập thành công! Chào mừng ${res.user.full_name} (${res.user.position || 'Nhân viên'})`);
      } else {
        toast.error(res.error || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi xác thực tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/30 to-background flex flex-col justify-center items-center p-4 sm:p-6 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="w-full max-w-md">
        {/* FORM ĐĂNG NHẬP */}
        <div className="bg-card border border-border/80 rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
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
              Chỉ cho phép tài khoản nhân viên được lưu trên Google Sheets
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
                  placeholder="VD: nv001, NV-001 hoặc 0352545521"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  required
                  autoFocus
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
              <span>{isLoading ? 'Đang xác thực Google Sheets...' : 'Đăng nhập vào hệ thống'}</span>
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Xác thực Google Sheets</span>
            </span>
            <span>Phiên bản 2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
