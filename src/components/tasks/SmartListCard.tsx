import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PastelColor } from '@/types';

interface SmartListCardProps {
  title: string;
  count: number;
  icon?: LucideIcon;
  color: PastelColor | 'amber-warm' | 'primary';
  onClick: () => void;
  empty?: boolean;
  emptyLabel?: string;
  dotOnly?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
  coral: { bg: 'bg-pastel-coral/20', text: 'text-pastel-coral', dot: 'bg-pastel-coral' },
  peach: { bg: 'bg-pastel-peach/25', text: 'text-pastel-peach', dot: 'bg-pastel-peach' },
  amber: { bg: 'bg-pastel-amber/20', text: 'text-pastel-amber', dot: 'bg-pastel-amber' },
  yellow: { bg: 'bg-pastel-yellow/40', text: 'text-pastel-amber', dot: 'bg-pastel-yellow' },
  mint: { bg: 'bg-pastel-mint/25', text: 'text-pastel-mint', dot: 'bg-pastel-mint' },
  teal: { bg: 'bg-pastel-teal/25', text: 'text-pastel-teal', dot: 'bg-pastel-teal' },
  sky: { bg: 'bg-pastel-sky/20', text: 'text-pastel-sky', dot: 'bg-pastel-sky' },
  lavender: { bg: 'bg-pastel-lavender/30', text: 'text-pastel-lavender', dot: 'bg-pastel-lavender' },
  rose: { bg: 'bg-pastel-rose/25', text: 'text-pastel-rose', dot: 'bg-pastel-rose' },
  gray: { bg: 'bg-pastel-gray/25', text: 'text-pastel-gray', dot: 'bg-pastel-gray' },
  stone: { bg: 'bg-pastel-stone/40', text: 'text-pastel-gray', dot: 'bg-pastel-stone' },
  'amber-warm': { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500' },
  primary: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
};

export function SmartListCard({
  title,
  count,
  icon: Icon,
  color,
  onClick,
  empty,
  emptyLabel,
  dotOnly,
}: SmartListCardProps) {
  const colors = colorMap[color] ?? colorMap.primary;
  const showDot = dotOnly || !Icon;

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
        <div className="w-9 h-9 flex items-center justify-center">
          {showDot ? (
            <div className={cn('w-9 h-9 rounded-full', colors.dot)} />
          ) : (
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', colors.bg)}>
              {Icon && <Icon className={cn('w-[18px] h-[18px]', colors.text)} />}
            </div>
          )}
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
