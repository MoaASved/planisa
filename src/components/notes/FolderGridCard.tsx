import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// viewBox 0 0 200 130.
// Direct translation of the user's clip-path (CSS path() doesn't support % or calc,
// so percentages and calc expressions are resolved into viewBox units):
//   55% → 110,  60% → 120,  65% → 130,  70% → 140,  75% → 150
//   100% - 16  → 184 (x),  100% - 16 → 114 (y)
// Shape: rounded top-left corner starting at y=20, flat at y=0 across the left
// portion (to 55%), smooth S-curve step-down to y=24 (55–75%), flat right section
// at y=24, rounded step to y=40 at the right edge, straight right side down,
// fully rounded bottom corners.
const FOLDER_PATH =
  'M 0 20 Q 0 0 20 0 L 110 0 Q 120 0 130 12 Q 140 24 150 24 L 184 24 Q 200 24 200 40 L 200 114 Q 200 130 184 130 L 16 130 Q 0 130 0 114 Z';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const baseColor = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-95 relative block"
      >
        {/* Folder silhouette — flat solid color, no border, no shadow */}
        <svg
          viewBox="0 0 200 130"
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={FOLDER_PATH} fill={baseColor} />
        </svg>

        {/* Name + count — bottom-left, stays clear of ··· button */}
        <div className="absolute bottom-0 left-0 right-8 px-3 pb-3 pointer-events-none">
          <p className="text-sm font-semibold text-foreground/80 leading-tight truncate">{folder.name}</p>
          <p className="text-xs text-foreground/50 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ··· menu — bottom-right; always visible on mobile, hover on desktop */}
        <div
          className="absolute bottom-2 right-2 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-foreground/60" />
        </div>
      </button>
    </div>
  );
}
