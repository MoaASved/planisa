import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// viewBox 0 0 200 142.
//
// BACK_PATH  — original folder silhouette, occupies y=0–130.
// FRONT_PATH — same shape shifted +12 in every y-coordinate, occupying y=12–142.
//
// The front card (rendered second) covers the back panel everywhere they overlap.
// The 12-unit strip at the top of the back panel that remains uncovered creates
// the illusion of a physical folder back panel peeking above the front card.
const BACK_PATH =
  'M 0 20 Q 0 0 20 0 L 110 0 Q 120 0 130 12 Q 140 24 150 24 L 184 24 Q 200 24 200 40 L 200 114 Q 200 130 184 130 L 16 130 Q 0 130 0 114 Z';
const FRONT_PATH =
  'M 0 32 Q 0 12 20 12 L 110 12 Q 120 12 130 24 Q 140 36 150 36 L 184 36 Q 200 36 200 52 L 200 126 Q 200 142 184 142 L 16 142 Q 0 142 0 126 Z';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const base = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;

  // Back panel: horizontal gradient — same color but muted/darker, lighter on
  // left and progressively darker on right to give the panel depth.
  const backL = `color-mix(in srgb, ${base} 88%, #2C2C2A)`;
  const backR = `color-mix(in srgb, ${base} 72%, #2C2C2A)`;

  // Front card: very subtle vertical gradient — barely lighter at top.
  const frontT = `color-mix(in srgb, ${base} 90%, white)`;

  // Shared border: slightly darker than the folder color.
  const borderColor = `color-mix(in srgb, ${base} 68%, #2C2C2A)`;

  const bgId = `bg-${folder.id}`;
  const fgId = `fg-${folder.id}`;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-95 relative block"
      >
        <svg
          viewBox="0 0 200 142"
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Back panel gradient: left → right (lighter → darker) */}
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={backL} />
              <stop offset="100%" stopColor={backR} />
            </linearGradient>
            {/* Front card gradient: top → bottom (very subtle) */}
            <linearGradient id={fgId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={frontT} />
              <stop offset="100%" stopColor={base} />
            </linearGradient>
          </defs>

          {/* Back panel — drawn first so front card renders on top */}
          <path
            d={BACK_PATH}
            fill={`url(#${bgId})`}
            stroke={borderColor}
            strokeWidth="1"
          />

          {/* Front card — covers back panel body; only the top 12-unit strip shows */}
          <path
            d={FRONT_PATH}
            fill={`url(#${fgId})`}
            stroke={borderColor}
            strokeWidth="1"
          />
        </svg>

        {/* Name + count — bottom-left of front card, smaller proportional size */}
        <div className="absolute bottom-0 left-0 right-8 px-2.5 pb-2.5 pointer-events-none">
          <p className="text-xs font-semibold text-foreground/80 leading-tight truncate">{folder.name}</p>
          <p className="text-[10px] leading-tight text-foreground/50 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ··· — bottom-right; always visible on mobile, hover on desktop */}
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
