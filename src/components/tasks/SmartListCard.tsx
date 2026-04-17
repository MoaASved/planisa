import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PastelColor } from '@/types';

interface SmartListCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: PastelColor | 'amber-warm' | 'primary';
  onClick: () => void;
  empty?: boolean;
  emptyLabel?: string;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  coral: { bg: 'bg-pastel-coral/20', text: 'text-pastel-coral' },
  peach: { bg: 'bg-pastel-peach/25', text: 'text-pastel-peach' },
  amber: { bg: 'bg-pastel-amber/20', text: 'text-pastel-amber' },
  yellow: { bg: 'bg-pastel-yellow/40', text: 'text-pastel-amber' },
  mint: { bg: 'bg-pastel-mint/25', text: 'text-pastel-mint' },
  teal: { bg: 'bg-pastel-teal/25', text: 'text-pastel-teal' },
  sky: { bg: 'bg-pastel-sky/20', text: 'text-pastel-sky' },
  lavender: { bg: 'bg-pastel-lavender/30', text: 'text-pastel-lavender' },
  rose: { bg: 'bg-pastel-rose/25', text: 'text-pastel-rose' },
  gray: { bg: 'bg-pastel-gray/25', text: 'text-pastel-gray' },
  stone: { bg: 'bg-pastel-stone/40', text: 'text-pastel-gray' },
  'amber-warm': { bg: 'bg-amber-500/15', text: 'text-amber-500' },
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
};

export function SmartListCard({
  title,
  count,
  icon: Icon,
  color,
  onClick,
  empty,
  emptyLabel,
}: SmartListCardProps) {
  const colors = colorMap[color] ?? colorMap.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full bg-card rounded-2xl p-4 text-left transition-all',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.98]',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            colors.bg,
          )}
        >
          <Icon className={cn('w-[18px] h-[18px]', colors.text)} />
        </div>
        {!empty && (
          <span className="text-2xl font-semibold text-foreground tabular-nums leading-none">
            {count}
          </span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-foreground tracking-tight">
        {title}
      </p>
      {empty && (
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {emptyLabel ?? 'Tap to pin a list'}
        </p>
      )}
    </button>
  );
}
