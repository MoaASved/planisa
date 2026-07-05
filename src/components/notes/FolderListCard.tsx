import { useRef } from 'react';
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
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);

  return (
    <div className="group relative">
      <button
        onPointerDown={(e) => { tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }}
        onPointerUp={(e) => {
          const s = tapStart.current;
          tapStart.current = null;
          if (!s) return;
          if (Math.abs(e.clientX - s.x) < 10 && Math.abs(e.clientY - s.y) < 10 && Date.now() - s.t < 200) onClick();
        }}
        className="text-left transition-all duration-200 w-full rounded-2xl p-4 bg-card border border-black/[0.04] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98] flex items-center gap-3"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Colored swatch replacing the folder illustration */}
        <div
          className="flex-shrink-0 rounded-xl pointer-events-none"
          style={{ width: '44px', height: '34px', background: gradient }}
        />

        {/* Name + count */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{folder.name}</p>
          <p className="text-xs leading-tight text-muted-foreground mt-0.5" style={{ opacity: 0.55 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Three-dot menu */}
        <div
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          className="flex-shrink-0 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}
