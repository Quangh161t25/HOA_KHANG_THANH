import type { TooltipProps } from 'recharts';

/** Ô tooltip dùng chung cho biểu đồ recharts. */
export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md px-3 py-2 text-xs">
      {label != null && label !== '' && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (p.payload as { fill?: string })?.fill ?? p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}
