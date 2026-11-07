import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';

type Field = 'current' | 'new' | 'confirm';

const inputCls =
  'flex h-10 w-full rounded-lg border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

/** Hộp thoại đổi mật khẩu: kiểm tra hợp lệ, cập nhật vào store và tự động đồng bộ Google Sheets. */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const { employees, updateEmployee } = useEmployeeStore();

  const [values, setValues] = useState<Record<Field, string>>({ current: '', new: '', confirm: '' });
  const [visible, setVisible] = useState<Record<Field, boolean>>({ current: false, new: false, confirm: false });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.current.trim()) return setError(t('nav.changePassword.errorCurrentRequired'));
    if (values.new.length < 6) return setError(t('nav.changePassword.errorNewMin'));
    if (values.new !== values.confirm) return setError(t('nav.changePassword.errorConfirmMismatch'));

    setSaving(true);
    try {
      if (user) {
        const emp = employees.find((e) => e.id === user.id || e.code === user.code);
        if (emp) {
          const currentEmpPassword = emp.password || '123456';
          if (values.current !== currentEmpPassword) {
            setError('Mật khẩu hiện tại không chính xác.');
            setSaving(false);
            return;
          }
          // Cập nhật mật khẩu mới cho nhân viên (tự động đồng bộ sang Google Sheets)
          updateEmployee(emp.id, { password: values.new });
        }
      }

      await new Promise((r) => setTimeout(r, 600));
      setSaving(false);
      onClose();
      toast.success(t('nav.changePassword.success'));
    } catch {
      setSaving(false);
      setError('Có lỗi xảy ra khi đổi mật khẩu.');
    }
  };

  const field = (key: Field, labelKey: string, autoComplete: string, hint?: string) => (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{t(labelKey)}</label>
      <div className="relative">
        <input
          type={visible[key] ? 'text' : 'password'}
          value={values[key]}
          onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
          placeholder="••••••••"
          className={inputCls}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
          aria-label={visible[key] ? t('nav.changePassword.hidePassword') : t('nav.changePassword.showPassword')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
        >
          {visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-card rounded-xl shadow-2xl border border-border/40 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <h2 id="change-password-title" className="text-lg font-bold text-foreground">
                {t('nav.changePassword.title')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t('nav.changePassword.description')}</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">{error}</div>}
            {field('current', 'nav.changePassword.currentPassword', 'current-password')}
            {field('new', 'nav.changePassword.newPassword', 'new-password', t('nav.changePassword.newPasswordHint'))}
            {field('confirm', 'nav.changePassword.confirmPassword', 'new-password')}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-lg h-10 text-sm font-medium" onClick={onClose} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="flex-1 rounded-lg h-10 text-sm font-medium" isLoading={saving} disabled={saving}>
                {t('nav.changePassword.submit')}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
