import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

// Exported — used by FolderListCard.tsx
export function shiftLightness(hslTriple: string, deltaPct: number, chromaMul = 1): string {
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

// Identical paths to FolderListCard — same geometry scaled up by CSS width.
const BACK_PATH =
  'M 6 10.2 Q 6 1.7 16 1.7 L 184 1.7 Q 194 1.7 194 10.2 L 194 108.8 L 6 108.8 Z';
const FRONT_PATH =
  'M 0 27.2 Q 0 10.2 20 10.2 L 110 10.2 Q 120 10.2 130 20.4 Q 140 30.6 150 30.6 L 184 30.6 Q 200 30.6 200 44.2 L 200 107.1 Q 200 120.7 184 120.7 L 16 120.7 Q 0 120.7 0 107.1 Z';
const TOP_EDGE_PATH =
  'M 0 27.2 Q 0 10.2 20 10.2 L 110 10.2 Q 120 10.2 130 20.4 Q 140 30.6 150 30.6 L 184 30.6 Q 200 30.6 200 44.2';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;

  const raw =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(`--pastel-${folder.color || 'stone'}`)
          .trim()
      : '30 10% 78%';

  const lightTop        = shiftLightness(raw, +10);
  const saturatedBottom = shiftLightness(raw, -5, 1.15);
  const backL           = shiftLightness(raw, -2);
  const backR           = shiftLightness(raw, -8, 1.05);

  const bgId   = `gbg-${folder.id}`;
  const fgId   = `gfg-${folder.id}`;
  const hlId   = `ghl-${folder.id}`;
  const fadeId = `gfade-${folder.id}`;
  const maskId = `gmask-${folder.id}`;

  return (
    <div className="group">
      {/* px-2 insets the card visually so there is breathing room between cards in the grid */}
      <div className="px-2">
      {/* box-shadow on outer wrapper so it doesn't clip the SVG */}
      <div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '8px', background: 'transparent' }}>
        <button
          onClick={onClick}
          className="w-full transition-all active:scale-95 relative block"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          <svg
            viewBox="0 0 200 121"
            className="w-full h-auto block"
            style={{ background: 'transparent' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="121" gradientUnits="userSpaceOnUse">
                <stop offset="0%"  stopColor="white" stopOpacity="1" />
                <stop offset="33%" stopColor="white" stopOpacity="1" />
                <stop offset="60%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <mask id={maskId}>
                <path d={BACK_PATH} fill={`url(#${fadeId})`} />
              </mask>
              <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={backL} />
                <stop offset="100%" stopColor={backR} />
              </linearGradient>
              <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor={lightTop} />
                <stop offset="100%" stopColor={saturatedBottom} />
              </linearGradient>
              <linearGradient id={hlId} x1="0" y1="0" x2="0.7" y2="0.7">
                <stop offset="0%"  stopColor="white" stopOpacity="0.38" />
                <stop offset="55%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Back flap — fades out downward so only the top peeks above the front */}
            <path d={BACK_PATH}     fill={`url(#${bgId})`}  fillOpacity="0.92" stroke="rgba(255,255,255,0.35)" strokeWidth="1" mask={`url(#${maskId})`} />
            {/* Front card body */}
            <path d={FRONT_PATH}    fill={`url(#${fgId})`}  fillOpacity="0.87" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
            {/* Diagonal white highlight */}
            <path d={FRONT_PATH}    fill={`url(#${hlId})`}  stroke="none" />
            {/* Top-edge specular strip */}
            <path d={TOP_EDGE_PATH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      </div>

      {/* Folder name + ··· menu below the card */}
      <div className="flex items-center justify-between mt-3 px-2">
        <p className="text-sm font-bold text-foreground truncate leading-tight flex-1 min-w-0">
          {folder.name}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="ml-1 p-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          aria-label="Folder options"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Item count */}
      <p className="text-[11px] text-muted-foreground/70 px-2 mt-0.5">
        {count} {count === 1 ? 'item' : 'items'}
      </p>
    </div>
  );
}
