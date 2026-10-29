import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Nhóm tab dạng "segmented" dùng ở đầu mỗi trang. */
export function Tabs<T extends string>({ tabs, activeTab, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50 w-fit', className)}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all select-none',
              active ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon size={14} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
