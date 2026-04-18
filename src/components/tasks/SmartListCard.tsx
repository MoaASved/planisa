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
  coral: { bg: 'bg-pastel-coral', text: 'text-pastel-coral-accent', dot: 'bg-pastel-coral-accent' },
  peach: { bg: 'bg-pastel-peach', text: 'text-pastel-peach-accent', dot: 'bg-pastel-peach-accent' },
  amber: { bg: 'bg-pastel-amber', text: 'text-pastel-amber-accent', dot: 'bg-pastel-amber-accent' },
  yellow: { bg: 'bg-pastel-yellow', text: 'text-pastel-amber-accent', dot: 'bg-pastel-yellow-accent' },
  mint: { bg: 'bg-pastel-mint', text: 'text-pastel-mint-accent', dot: 'bg-pastel-mint-accent' },
  teal: { bg: 'bg-pastel-teal', text: 'text-pastel-teal-accent', dot: 'bg-pastel-teal-accent' },
  sky: { bg: 'bg-pastel-sky', text: 'text-pastel-sky-accent', dot: 'bg-pastel-sky-accent' },
  lavender: { bg: 'bg-pastel-lavender', text: 'text-pastel-lavender-accent', dot: 'bg-pastel-lavender-accent' },
  rose: { bg: 'bg-pastel-rose', text: 'text-pastel-rose-accent', dot: 'bg-pastel-rose-accent' },
  gray: { bg: 'bg-pastel-gray', text: 'text-pastel-gray-accent', dot: 'bg-pastel-gray-accent' },
  stone: { bg: 'bg-pastel-stone', text: 'text-pastel-gray-accent', dot: 'bg-pastel-stone-accent' },
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
            <div className={cn('w-9 h-9 rounded-full', colors.bg)} />
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
      <p className="text-[16px] font-semibold text-foreground tracking-tight">
        {title}
      </p>
      {empty && (
        <p className="flow-meta-sm mt-0.5">
          {emptyLabel ?? 'Tap to pin a list'}
        </p>
      )}
    </button>
  );
}
