import { Link } from 'react-router-dom';
import { ArrowLeft, Puzzle, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n';

/** Trang "Sắp ra mắt" cho các phân hệ/module chưa dựng lại. */
export function PlaceholderPage({ title, icon: Icon = Puzzle, backTo = '/', backLabel }: { title?: string; icon?: LucideIcon; backTo?: string; backLabel?: string }) {
  const heading = title ?? t('page.placeholder.title');
  const description = title ? t('page.placeholder.descriptionWithModule', { name: title }) : t('page.placeholder.description');
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6 placeholder-bg-grid bg-muted/30">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
            {t('page.placeholder.badgeComingSoon')}
          </span>
        </div>
        <div className="mb-10 relative inline-block">
          <div className="placeholder-float">
            <Icon className="w-36 h-36 md:w-48 md:h-48 mx-auto text-primary" strokeWidth={1.2} aria-hidden />
          </div>
          <div
            className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 bg-primary/20 dark:bg-primary/25 blur-3xl rounded-full"
            aria-hidden
          />
        </div>
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 tracking-tight ${title ? 'text-primary' : 'text-foreground'}`}>{heading}</h1>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">{description}</p>
        <div className="flex flex-col items-center justify-center gap-6">
          <Link
            to={backTo}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-full hover:opacity-90 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/25"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {backLabel ?? t('page.placeholder.backToHome')}
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {t('page.placeholder.refreshPage')}
          </button>
        </div>
      </div>
    </div>
  );
}
