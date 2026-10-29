import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, House } from 'lucide-react';
import { t } from '@/lib/i18n';
import { NAV_ITEMS } from '@/config/navigation';
import { MODULE_ROOTS } from '@/config/modules';

/** Nhãn cho từng đường dẫn: mục menu + module con của Hành chính/Nhân sự. */
function buildLabels() {
  const labels: Record<string, string> = {};
  NAV_ITEMS.forEach((n) => (labels[n.path] = t(n.nameKey)));
  MODULE_ROOTS.forEach((root) => {
    labels[root.base] = t(root.labelKey);
    root.groups.forEach((g) => g.items.forEach((m) => (labels[`${root.base}/${m.slug}`] = t(m.titleKey))));
  });
  return labels;
}

function BreadcrumbInner() {
  const { pathname } = useLocation();
  const labels = useMemo(buildLabels, []);
  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, i) => {
      const to = `/${parts.slice(0, i + 1).join('/')}`;
      const label = labels[to] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      return { label, to, isLast: i === parts.length - 1 };
    });
  }, [pathname, labels]);

  if (pathname === '/') {
    return (
      <nav aria-label={t('breadcrumb.label')}>
        <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
          <li className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md text-primary" aria-hidden>
              <House size={14} />
            </span>
            <span
              className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20"
              aria-current="page"
            >
              Dashboard
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label={t('breadcrumb.label')}>
      <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
        <li className={`flex items-center gap-1.5 ${crumbs.length > 1 ? 'hidden md:flex' : 'flex'}`}>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all px-2 py-0.5"
            title={t('breadcrumb.goHome')}
          >
            <House size={14} />
            <span className="text-xs font-normal whitespace-nowrap">{t('breadcrumb.home')}</span>
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const collapse = crumbs.length > 2 && i < crumbs.length - 2;
          const chevronCls = `text-muted-foreground shrink-0${i === 0 ? ' hidden md:block' : ''}`;
          return (
            <li key={c.to} className={`flex items-center gap-1 ${collapse ? 'hidden md:flex' : 'flex'}`}>
              <ChevronRight size={12} className={chevronCls} />
              {c.isLast ? (
                <span
                  className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20"
                  aria-current="page"
                >
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className="px-2 py-0.5 rounded-md text-muted-foreground hover:text-primary text-xs font-normal transition-all whitespace-nowrap">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const Breadcrumb = memo(BreadcrumbInner);
