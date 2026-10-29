import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown, FileDown, Printer, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Spinner } from '@/components/ui/Feedback';
import { ChartTooltip } from './ChartTooltip';

/** Các khối dựng sẵn cho tab "Thống kê" / "Báo cáo" (giống bố cục bản gốc). */

export const CHART_HEIGHT = 220;
export const CHART_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export interface ChartDatum {
  name: string;
  value: number;
}

export interface CountRow {
  id: string;
  ten: string;
  count: number;
}

/** Nút "Thao tác ▾" với Xuất báo cáo / In báo cáo. */
export function StatsActionsMenu({
  label,
  exportLabel,
  printLabel,
  onExport,
  onPrint,
}: {
  label: string;
  exportLabel: string;
  printLabel: string;
  onExport: () => void;
  onPrint: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-8 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all active:scale-[0.98]',
          open ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        <span>{label}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] bg-card rounded-xl shadow-xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors"
          >
            <FileDown size={16} className="text-muted-foreground" />
            {exportLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onPrint();
              setOpen(false);
            }}
            className="w-full h-9 px-3 flex items-center gap-2 text-left text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
          >
            <Printer size={16} className="text-muted-foreground" />
            {printLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/** Một thẻ số liệu nhỏ. `primary` = thẻ "Tổng" có nền màu chủ đạo cho icon. */
export function StatCard({ label, value, icon: Icon, colorClass, primary, className }: { label: string; value: ReactNode; icon: LucideIcon; colorClass?: string; primary?: boolean; className?: string }) {
  return (
    <div className={cn('bg-card rounded-lg border border-border p-2.5 sm:p-3 transition-all hover:shadow-sm', className)}>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
            primary ? 'bg-primary/10' : cn('border', colorClass ?? 'bg-muted/80 text-muted-foreground border-border'),
          )}
        >
          <Icon size={15} className={primary ? 'text-primary' : undefined} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate" title={label}>
            {label}
          </p>
          <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function ChartCard({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-3.5', className)}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/** Recharts cần khung đã có kích thước: trì hoãn vẽ một nhịp như bản gốc. */
export function useChartReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(id);
  }, []);
  return ready;
}

const tick = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };

export function BarChartBox({ data, seriesName, height = CHART_HEIGHT, layout = 'horizontal' }: { data: ChartDatum[]; seriesName: string; height?: number; layout?: 'horizontal' | 'vertical' }) {
  const vertical = layout === 'vertical';
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} barSize={vertical ? 18 : 28} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        {vertical ? (
          <>
            <XAxis type="number" tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={tick} axisLine={false} tickLine={false} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
        <Bar dataKey="value" radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} name={seriesName}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartBox({ data, height = CHART_HEIGHT }: { data: ChartDatum[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => <span className="text-muted-foreground text-caption">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Bảng "Tên | Số lượng" dưới phần biểu đồ. */
export function CountTable({ title, icon, rows, nameLabel, countLabel, emptyText }: { title: string; icon: ReactNode; rows: CountRow[]; nameLabel: string; countLabel: string; emptyText: string }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">{nameLabel}</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">{countLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2 text-foreground">{r.ten}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Khung chờ khi đang tải thống kê. */
export function StatsLoading({ text, cards = 5 }: { text: string; cards?: number }) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
        <Spinner text={text} centered />
      </div>
      <div className="flex-1 p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {Array.from({ length: cards }).map((_, k) => (
            <div key={k} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
              <div className="h-12 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsError({ text }: { text?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-sm text-destructive">{text ?? t('common.error')}</p>
    </div>
  );
}

/** Đếm theo khóa, trả về danh sách sắp giảm dần. */
export function countBy<T>(rows: T[], key: (r: T) => string | null | undefined, name: (id: string, r: T) => string): CountRow[] {
  const map = new Map<string, CountRow>();
  rows.forEach((r) => {
    const id = key(r);
    if (id == null || id === '') return;
    const row = map.get(id) ?? { id, ten: name(id, r), count: 0 };
    row.count += 1;
    map.set(id, row);
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export const toChart = (rows: CountRow[]): ChartDatum[] => rows.map((r) => ({ name: r.ten, value: r.count }));
