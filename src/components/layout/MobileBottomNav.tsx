import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, House } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useNotificationStore } from '@/stores/notifications';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return mobile;
}

/** Thanh điều hướng dưới cùng trên điện thoại: Quay lại · Trang chủ · Thông báo. */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  if (!isMobile) return null;
  const parent = pathname === '/' ? undefined : pathname.split('/').slice(0, -1).join('/') || '/';

  return (
    <nav
      aria-label={t('nav.mainNav')}
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-center h-16 px-2">
        <div className="flex-1 flex justify-center items-center min-w-0">
          {parent !== undefined ? (
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(parent))}
              aria-label={t('nav.back')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
            >
              <ChevronLeft size={24} strokeWidth={2} className="shrink-0" />
            </button>
          ) : (
            <div className="min-w-[44px] min-h-[44px]" aria-hidden />
          )}
        </div>
        <div className="flex-1 flex justify-center items-center min-w-0 -mt-5">
          <Link
            to="/"
            aria-label={t('nav.home')}
            aria-current={pathname === '/' ? 'page' : undefined}
            className={cn(
              'min-h-[56px] min-w-[56px] flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95',
              pathname === '/'
                ? 'bg-primary text-primary-foreground shadow-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-border/50',
            )}
          >
            <House size={26} strokeWidth={2} className="shrink-0" />
          </Link>
        </div>
        <div className="flex-1 flex justify-center items-center min-w-0">
          <span className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground">
            <Bell size={24} strokeWidth={1.8} className="shrink-0" />
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-xs font-semibold text-primary-foreground rounded-full shadow-sm ring-2 ring-card"
                aria-hidden
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </span>
        </div>
      </div>
    </nav>
  );
}
