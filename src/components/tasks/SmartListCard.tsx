import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PastelColor } from '@/types';

interface SmartListCardProps {
  title: string;
  count: number;
  icon?: LucideIcon;
  color: PastelColor | 'amber-warm' | 'emerald' | 'smart-today' | 'smart-priority' | 'primary';
  onClick: () => void;
  empty?: boolean;
  emptyLabel?: string;
  dotOnly?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; dot: string; iconClass?: string }> = {
  fern: { bg: 'bg-pastel-fern', text: 'text-pastel-fern-accent', dot: 'bg-pastel-fern-accent' },
  pistachio: { bg: 'bg-pastel-pistachio', text: 'text-pastel-pistachio-accent', dot: 'bg-pastel-pistachio-accent' },
  lagune: { bg: 'bg-pastel-lagune', text: 'text-pastel-lagune-accent', dot: 'bg-pastel-lagune-accent' },
  sky: { bg: 'bg-pastel-sky', text: 'text-pastel-lagune-accent', dot: 'bg-pastel-sky-accent' },
  peach: { bg: 'bg-pastel-peach', text: 'text-pastel-peach-accent', dot: 'bg-pastel-peach-accent' },
  honey: { bg: 'bg-pastel-honey', text: 'text-pastel-honey-accent', dot: 'bg-pastel-honey-accent' },
  peony: { bg: 'bg-pastel-peony', text: 'text-pastel-peony-accent', dot: 'bg-pastel-peony-accent' },
  rose: { bg: 'bg-pastel-rose', text: 'text-pastel-rose-accent', dot: 'bg-pastel-rose-accent' },
  plum: { bg: 'bg-pastel-plum', text: 'text-pastel-plum-accent', dot: 'bg-pastel-plum-accent' },
  flamingo: { bg: 'bg-pastel-flamingo', text: 'text-pastel-flamingo-accent', dot: 'bg-pastel-flamingo-accent' },
  stone: { bg: 'bg-pastel-stone', text: 'text-pastel-stone-accent', dot: 'bg-pastel-stone-accent' },
  none: { bg: 'bg-pastel-none', text: 'text-pastel-none-accent', dot: 'bg-pastel-none-accent' },
  radicchio: { bg: 'bg-pastel-radicchio', text: 'text-pastel-radicchio-accent', dot: 'bg-pastel-radicchio-accent' },
  mango: { bg: 'bg-pastel-mango', text: 'text-pastel-mango-accent', dot: 'bg-pastel-mango-accent' },
  amethyst: { bg: 'bg-pastel-amethyst', text: 'text-pastel-amethyst-accent', dot: 'bg-pastel-amethyst-accent' },
  cocoa: { bg: 'bg-pastel-cocoa', text: 'text-pastel-cocoa-accent', dot: 'bg-pastel-cocoa-accent' },
  birch: { bg: 'bg-pastel-birch', text: 'text-pastel-birch-accent', dot: 'bg-pastel-birch-accent' },
  graphite: { bg: 'bg-pastel-graphite', text: 'text-pastel-graphite-accent', dot: 'bg-pastel-graphite-accent' },
  'amber-warm': { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500', iconClass: 'fill-amber-500 text-amber-500' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  'smart-today': { bg: 'bg-smart-today/15', text: 'text-smart-today', dot: 'bg-smart-today' },
  'smart-priority': { bg: 'bg-smart-priority/15', text: 'text-smart-priority', dot: 'bg-smart-priority', iconClass: 'fill-smart-priority text-smart-priority' },
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
        'w-full p-4 text-left transition-all active:scale-[0.98]',
        // Light mode — glassmorphism
        'bg-gradient-to-br from-white/[0.92] to-white/[0.82]',
        'border border-white/45 rounded-[22px]',
        'shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
        // Dark mode — restore original card style exactly
        'dark:bg-card dark:[background-image:none] dark:border-0 dark:rounded-2xl',
        'dark:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        'dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]',
      )}
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 flex items-center justify-center">
          {showDot ? (
            <div className={cn('w-9 h-9 rounded-full', colors.bg)} />
          ) : (
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', colors.bg)}>
              {Icon && <Icon className={cn('w-[18px] h-[18px]', colors.iconClass ?? colors.text)} />}
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
