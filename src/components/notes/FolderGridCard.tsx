import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// viewBox 200 × 110. Tab spans the left ~40% of the top edge at y=0.
// A smooth cubic bezier transitions from (80,0) down to (116,20), where
// the main body top begins. The curve stays flat at tab level initially,
// then sweeps smoothly down — creating the classic folder silhouette.
const FOLDER_PATH =
  'M 0 8 Q 0 0, 8 0 L 80 0 C 98 0, 104 20, 116 20 L 192 20 Q 200 20, 200 28 L 200 102 Q 200 110, 192 110 L 8 110 Q 0 110, 0 102 Z';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const baseColor = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;
  const lighterColor = `color-mix(in srgb, ${baseColor} 55%, white)`;
  const gradientId = `fill-${folder.id}`;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-95 relative block"
      >
        {/* Folder shape */}
        <svg
          viewBox="0 0 200 110"
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighterColor} />
              <stop offset="100%" stopColor={baseColor} />
            </linearGradient>
          </defs>
          <path
            d={FOLDER_PATH}
            fill={`url(#${gradientId})`}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="1"
          />
        </svg>

        {/* Name + count — bottom-left */}
        <div className="absolute bottom-0 left-0 right-8 px-3 pb-3 pointer-events-none">
          <p className="text-sm font-semibold text-foreground/80 leading-tight truncate">{folder.name}</p>
          <p className="text-xs text-foreground/50 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ··· menu — bottom-right, always visible on mobile / hover on desktop */}
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
