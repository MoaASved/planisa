import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// Resolves an "H S% L%" string to OKLCH, shifts L only, returns oklch().
function shiftLightness(hslTriple: string, deltaPct: number, chromaMul = 1): string {
  const [h, s, l] = (hslTriple.match(/[\d.]+/g) ?? []).map(Number);
  if ([h, s, l].some(Number.isNaN)) return `hsl(${hslTriple})`;
  const sat = s / 100, lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lig - c / 2;
  const [r1, g1, b1] =
    h < 60  ? [c, x, 0] : h < 120 ? [x, c, 0] :
    h < 180 ? [0, c, x] : h < 240 ? [0, x, c] :
    h < 300 ? [x, 0, c] : [c, 0, x];
  const lin = (v: number) => { v += m; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = [lin(r1), lin(g1), lin(b1)];
  const L_ = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const M_ = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const S_ = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  let okL = 0.2104542553*L_ + 0.7936177850*M_ - 0.0040720468*S_;
  const okA = 1.9779984951*L_ - 2.4285922050*M_ + 0.4505937099*S_;
  const okB = 0.0259040371*L_ + 0.7827717662*M_ - 0.8086757660*S_;
  okL = Math.max(0, Math.min(1, okL + deltaPct / 100));
  return `oklch(${okL.toFixed(4)} ${(Math.hypot(okA, okB) * chromaMul).toFixed(4)} ${((Math.atan2(okB, okA) * 180 / Math.PI + 360) % 360).toFixed(2)})`;
}

const BACK_PATH =
  'M 6 10.2 Q 6 1.7 16 1.7 L 184 1.7 Q 194 1.7 194 10.2 L 194 108.8 L 6 108.8 Z';
const FRONT_PATH =
  'M 0 27.2 Q 0 10.2 20 10.2 L 110 10.2 Q 120 10.2 130 20.4 Q 140 30.6 150 30.6 L 184 30.6 Q 200 30.6 200 44.2 L 200 107.1 Q 200 120.7 184 120.7 L 16 120.7 Q 0 120.7 0 107.1 Z';

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

  const frontR = shiftLightness(raw, -3, 1.08);
  const backL  = shiftLightness(raw, -2);
  const backR  = shiftLightness(raw, -8);
  const border = shiftLightness(raw, -2);

  const bgId = `bg-${folder.id}`;
  const fgId = `fg-${folder.id}`;
  const hlId = `hl-${folder.id}`;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-95 relative block"
      >
        <svg
          viewBox="0 0 200 121"
          className="w-full h-auto block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Back panel: L→R, base −8% to base −16% lightness */}
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={backL} />
              <stop offset="100%" stopColor={backR} />
            </linearGradient>
            {/* Front card highlight: top-left → bottom-right, white 25% → transparent */}
            <linearGradient id={hlId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="white" stopOpacity="0.25" />
              <stop offset="50%"  stopColor="white" stopOpacity="0" />
            </linearGradient>
            {/* Front card: L→R, exact base color (via CSS property) to base −8% */}
            <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="0">
              {/* stopColor as a CSS style property — supports var(), matches picker exactly */}
              <stop offset="0%" style={{ stopColor: `hsl(var(--pastel-${folder.color}))` }} />
              <stop offset="100%" stopColor={frontR} />
            </linearGradient>
          </defs>

          <path d={BACK_PATH}  fill={`url(#${bgId})`} stroke={border} strokeWidth="1" />
          <path d={FRONT_PATH} fill={`url(#${fgId})`} stroke={border} strokeWidth="1" />
          <path d={FRONT_PATH} fill={`url(#${hlId})`} stroke="none" />
        </svg>

        {/* Name + count — left-aligned, bottom-left of front card */}
        <div className="absolute bottom-0 left-0 right-8 px-2.5 pb-2.5 pointer-events-none text-left">
          <p className="text-xs font-semibold text-neutral-800 leading-tight truncate">{folder.name}</p>
          <p className="text-[10px] leading-tight text-neutral-600 mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ··· — bottom-right; always on mobile, hover on desktop */}
        <div
          className="absolute bottom-2 right-2 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-neutral-600" />
        </div>
      </button>
    </div>
  );
}
