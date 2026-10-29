import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useUiStore } from '@/stores/ui';

const pad = (n: number) => String(n).padStart(2, '0');

function nowIn(timezone: string) {
  const days = ['clock.sunday', 'clock.monday', 'clock.tuesday', 'clock.wednesday', 'clock.thursday', 'clock.friday', 'clock.saturday'].map((k) => t(k));
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const local = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
  return {
    time: `${pad(Number(get('hour')) % 24)}:${pad(Number(get('minute')))}:${pad(Number(get('second')))}`,
    date: `${days[local.getDay()]}, ${pad(Number(get('day')))}/${pad(Number(get('month')))}/${get('year')}`,
  };
}

/** Đồng hồ + ngày hiện tại trên header. */
export function HeaderClock() {
  const timezone = useUiStore((s) => s.timezone);
  const [now, setNow] = useState(() => nowIn(timezone));
  useEffect(() => {
    setNow(nowIn(timezone));
    const id = setInterval(() => setNow(nowIn(timezone)), 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <div className="hidden md:flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm select-none">
      <Clock size={14} className="text-primary shrink-0" />
      <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">{now.time}</span>
      <div className="w-px h-4 bg-border mx-1 shrink-0" aria-hidden />
      <Calendar size={14} className="text-primary shrink-0" />
      <span className="text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">{now.date}</span>
    </div>
  );
}
