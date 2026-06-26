import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// viewBox 200 × 110. One continuous top edge:
//   • starts at (0, 30) on the left — the lower "body" side
//   • a subtle Q rounds the top-left entry (0 30 → 8 22)
//   • a cubic bezier rises smoothly from (8, 22) to (192, 0) — the higher "tab" side
//   • Q rounds the top-right corner (192 0 → 200 8)
// Both bottom corners are fully rounded. No gradient, no stroke — flat solid color.
// Every junction is tangent-continuous (G1) so the silhouette reads as one smooth shape.
const FOLDER_PATH =
  'M 0 30 Q 0 22, 8 22 C 60 22, 140 0, 192 0 Q 200 0, 200 8 L 200 102 Q 200 110, 192 110 L 8 110 Q 0 110, 0 102 Z';

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
        {/* Folder silhouette — solid flat color */}
        <svg
          viewBox="0 0 200 110"
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={FOLDER_PATH} fill={baseColor} />
        </svg>

        {/* Name + count — bottom-left, clears the ··· button */}
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
