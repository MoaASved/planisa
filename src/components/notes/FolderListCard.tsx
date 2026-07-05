import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { getColorGradient } from '@/lib/colors';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
  onEdit?: () => void;
}

export function FolderListCard({ folder, count, onClick, onEdit }: FolderListCardProps) {
  const gradient = getColorGradient(folder.color || 'stone');

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="text-left transition-all duration-200 w-full rounded-2xl p-4 bg-card border border-black/[0.04] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98] flex items-center gap-3"
      >
        {/* Colored swatch replacing the folder illustration */}
        <div
          className="flex-shrink-0 rounded-xl"
          style={{ width: '44px', height: '34px', background: gradient }}
        />

        {/* Name + count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{folder.name}</p>
          <p className="text-xs leading-tight text-muted-foreground mt-0.5" style={{ opacity: 0.55 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Three-dot menu */}
        <div
          className="flex-shrink-0 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}
