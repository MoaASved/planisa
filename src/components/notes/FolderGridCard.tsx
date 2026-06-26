import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

const BACK_PATH =
  'M 6 12 Q 6 2 16 2 L 184 2 Q 194 2 194 12 L 194 128 L 6 128 Z';
const FRONT_PATH =
  'M 0 32 Q 0 12 20 12 L 110 12 Q 120 12 130 24 Q 140 36 150 36 L 184 36 Q 200 36 200 52 L 200 126 Q 200 142 184 142 L 16 142 Q 0 142 0 126 Z';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;

  // Read the resolved CSS variable value at render time so the correct color is
  // used for both light and dark mode without hardcoding anything.
  // --pastel-<name> resolves to e.g. "86 44% 83%" (H S% L%, space-separated).
  const raw =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(`--pastel-${folder.color}`)
          .trim()
      : '160 30% 65%';

  // Parse the three numeric components (strip % signs).
  const [h, s, l] = (raw.match(/[\d.]+/g) ?? ['160', '30', '65']).map(Number);

  // Build a plain hsl() stop with a lightness offset; clamps to [0, 100].
  const hsl = (dl: number) =>
    `hsl(${h} ${s}% ${Math.max(0, Math.min(100, l + dl))}%)`;

  // Front card: left = exact base color, right = base −8 L
  // Back panel: left = base −8 L,          right = base −16 L
  // Border:     base −12 L (within same hue family)
  const frontL = hsl(0);
  const frontR = hsl(-8);
  const backL  = hsl(-8);
  const backR  = hsl(-16);
  const border = hsl(-12);

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
            {/* Back panel: L→R, base −8% to base −16% lightness */}
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={backL} />
              <stop offset="100%" stopColor={backR} />
            </linearGradient>
            {/* Front card: L→R, exact base color to base −8% lightness */}
            <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={frontL} />
              <stop offset="100%" stopColor={frontR} />
            </linearGradient>
          </defs>

          <path d={BACK_PATH}  fill={`url(#${bgId})`} stroke={border} strokeWidth="1" />
          <path d={FRONT_PATH} fill={`url(#${fgId})`} stroke={border} strokeWidth="1" />
        </svg>

        {/* Name + count — left-aligned, bottom-left of front card */}
        <div className="absolute bottom-0 left-0 right-8 px-2.5 pb-2.5 pointer-events-none text-left">
          <p className="text-xs font-semibold text-foreground/80 leading-tight truncate">{folder.name}</p>
          <p className="text-[10px] leading-tight text-foreground/50 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ··· — bottom-right; always on mobile, hover on desktop */}
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
