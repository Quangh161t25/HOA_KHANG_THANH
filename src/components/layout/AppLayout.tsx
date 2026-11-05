import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, KeyRound, LogOut, PanelLeft, PanelLeftClose, Settings, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/config/navigation';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from './Breadcrumb';
import { HeaderClock } from './HeaderClock';
import { NotificationBell } from './NotificationBell';
import { MobileBottomNav } from './MobileBottomNav';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { GoogleSheetsHeaderButton } from '@/components/google-sheets/GoogleSheetsHeaderButton';

const SIDEBAR_OPEN = 240;
const SIDEBAR_CLOSED = 64;
const ease = { duration: 0.15, ease: 'circOut' as const };

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false));
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return mobile;
}

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

/** Khung web: thanh bên, header (breadcrumb, đồng hồ, thông báo, người dùng) và vùng nội dung. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, companyInfo } = useUiStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [tip, setTip] = useState<{ name: string; top: number; left: number } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const lastPath = useRef(location.pathname);
  const displayName = user?.full_name ?? 'User';

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      lastPath.current = location.pathname;
      if (isMobile && sidebarOpen) toggleSidebar();
    }
  }, [location.pathname, isMobile, sidebarOpen, toggleSidebar]);

  const doLogout = () => {
    logout();
    setConfirmLogout(false);
    setUserMenu(false);
    toast.success(t('nav.logout'));
  };

  const menuItemCls =
    'flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-all group';

  return (
    <div className="flex h-[100dvh] bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden min-h-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        {t('nav.skipToMain')}
      </a>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            role="button"
            tabIndex={0}
            aria-label={t('nav.closeOverlay')}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED }}
        transition={ease}
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-card border-r border-border/40 flex flex-col overflow-hidden md:relative',
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        <div className="flex h-12 md:h-14 items-center px-3 shrink-0 overflow-hidden border-b border-border/50">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="h-8 w-8 rounded-lg bg-primary shadow-sm flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <motion.div animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -10 }} transition={ease} className="min-w-0">
              <h2 className="text-xs font-bold text-foreground leading-tight truncate">{companyInfo.appName}</h2>
              <p className="text-xs text-muted-foreground truncate leading-tight">{companyInfo.appDescription || t('nav.defaultAppDescription')}</p>
            </motion.div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col py-3 relative">
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
            <nav className="px-2 space-y-1" aria-label={t('nav.mainNav')}>
              {NAV_ITEMS.map((item) => {
                const name = t(item.nameKey);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    aria-label={name}
                    title={name}
                    onClick={() => {
                      if (isMobile && sidebarOpen) toggleSidebar();
                    }}
                    onMouseEnter={(e) => {
                      if (!sidebarOpen) {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({ name, top: r.top + r.height / 2, left: r.right });
                      }
                    }}
                    onMouseLeave={() => setTip(null)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg transition-all relative min-h-[44px] h-11',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                        isActive ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="navIndicator"
                            className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full z-10"
                            transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                          />
                        )}
                        <div className="w-[60px] md:w-[56px] flex justify-center shrink-0">
                          <div
                            className={cn(
                              'flex items-center justify-center rounded-lg transition-all duration-200',
                              isActive ? 'w-8 h-8 bg-primary text-white shadow-sm' : 'w-8 h-8 bg-transparent text-inherit group-hover:bg-card group-hover:shadow-sm',
                            )}
                          >
                            <Icon size={16} className={cn('transition-all', isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]')} />
                          </div>
                        </div>
                        <motion.span
                          animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -5 }}
                          transition={ease}
                          className={cn(
                            'text-sm font-medium transition-colors whitespace-nowrap',
                            isActive ? 'text-primary font-bold' : 'text-inherit',
                            !sidebarOpen && 'pointer-events-none',
                          )}
                        >
                          {name}
                        </motion.span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none shrink-0" aria-hidden />
        </div>
      </motion.aside>
      {tip &&
        !sidebarOpen &&
        createPortal(
          <div
            className="fixed z-[9999] px-2.5 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-lg shadow-md border border-border/60 whitespace-nowrap pointer-events-none"
            style={{ top: tip.top, left: tip.left + 8, transform: 'translateY(-50%)' }}
          >
            {tip.name}
          </div>,
          document.body,
        )}

      <main id="main-content" className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain no-scrollbar bg-muted/30 relative">
        <header className="h-12 md:h-14 shrink-0 border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40 px-3 md:px-5 flex items-center justify-between gap-3 safe-area-top">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              aria-label={t(sidebarOpen ? 'nav.collapseSidebar' : 'nav.expandSidebar')}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg bg-muted/60 border border-border/80 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-90 shrink-0"
            >
              {sidebarOpen ? <PanelLeftClose size={12} /> : <PanelLeft size={12} />}
            </button>
            <div className="flex-1 min-w-0">
              <Breadcrumb />
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <GoogleSheetsHeaderButton />
            <HeaderClock />
            <NotificationBell />
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenu(!userMenu)}
                aria-label={t('nav.userMenu')}
                aria-expanded={userMenu}
                className="min-h-[44px] flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-all group"
              >
                <div className="relative shrink-0">
                  <img src={user?.avatar_url || avatarUrl('Nguoi Dung')} alt="Avatar" className="h-7 w-7 rounded-lg ring-1 ring-border shadow-sm object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-card rounded-full" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-tight">{displayName || t('nav.guestUser')}</p>
                  <p className="text-xs font-normal text-muted-foreground leading-tight">{user?.role === 'admin' ? t('nav.roleAdmin') : t('nav.roleMember')}</p>
                </div>
                <ChevronDown size={12} className={cn('text-muted-foreground/50 hidden md:block transition-transform', userMenu ? 'rotate-180' : '')} />
              </button>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden z-50 p-1.5"
                  >
                    <div className="px-3 py-2.5 border-b border-border md:hidden">
                      <p className="text-xs font-semibold text-foreground">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      <Link to="/ho-so" onClick={() => setUserMenu(false)} className={menuItemCls}>
                        <User size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> {t('nav.profile')}
                      </Link>
                      <Link to="/cai-dat" onClick={() => setUserMenu(false)} className={menuItemCls}>
                        <Settings size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> {t('nav.settings')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenu(false);
                          setChangePassword(true);
                        }}
                        className={`w-full ${menuItemCls} text-left`}
                      >
                        <KeyRound size={15} className="text-muted-foreground group-hover:text-primary transition-colors" /> {t('nav.changePassword')}
                      </button>
                      <div className="h-px bg-border my-1 mx-2" />
                      <button
                        onClick={() => setConfirmLogout(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all group"
                      >
                        <LogOut size={15} className="text-rose-300 group-hover:text-rose-500 transition-colors" /> {t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div key={location.pathname} className="flex-1 min-h-0 flex flex-col">
              {children}
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />

      <AnimatePresence>
        {confirmLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmLogout(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-xl p-6 max-w-sm w-full shadow-2xl border border-border/40 text-center"
            >
              <div className="h-12 w-12 bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t('nav.logoutConfirmTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t('nav.logoutConfirmMessage')}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-lg h-9 text-sm font-medium" onClick={() => setConfirmLogout(false)}>
                  {t('nav.logoutCancel')}
                </Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-9 text-sm font-medium shadow-sm" onClick={doLogout}>
                  {t('nav.logout')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>{changePassword && <ChangePasswordDialog onClose={() => setChangePassword(false)} />}</AnimatePresence>
    </div>
  );
}
