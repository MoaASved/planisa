import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Folder } from '@/types';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
}

export function FolderListCard({ folder, count, onClick }: FolderListCardProps) {
  const baseColor = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;
  const lighterColor = `color-mix(in srgb, ${baseColor} 55%, hsl(var(--card)))`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-black/[0.04]',
        'transition-all duration-200 active:scale-[0.98] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] group'
      )}
    >
      {/* Folder icon — same shape as grid view, scaled for list */}
      <div className="w-10 flex-shrink-0">
        <svg viewBox="0 0 200 150" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`list-fill-${folder.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighterColor} />
              <stop offset="100%" stopColor={baseColor} />
            </linearGradient>
          </defs>
          <path
            d="M 8 40 Q 0 40, 0 48 L 0 142 Q 0 150, 8 150 L 192 150 Q 200 150, 200 142 L 200 40 Q 200 32, 192 32 L 80 32 Q 74 32, 72 26 L 68 14 Q 66 8, 60 8 L 16 8 Q 8 8, 8 16 Z"
            fill={`url(#list-fill-${folder.id})`}
          />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="flow-card-title truncate">{folder.name}</h4>
        <p className="flow-meta">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
