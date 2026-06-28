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

// Folder shape: right-aligned tab (30% of card width), 10-unit elevation (subtle).
// Body top y=18, tab top y=8. Right edge goes to y=18 (no dip before tab corner).
// Cubic bezier shoulder has horizontal tangents on both sides — no kink.
// Shape fills viewBox 0 0 200 121 properly (body y=18→112, ~6px top breathing room).
const FRONT_PATH =
  'M 16 18 Q 0 18 0 32 L 0 99 Q 0 112 16 112 L 184 112 Q 200 112 200 99 L 200 18 Q 200 8 190 8 L 154 8 C 149 8 144 18 140 18 L 16 18 Z';
const TOP_EDGE_PATH =
  'M 16 18 L 140 18 C 144 18 149 8 154 8 L 190 8 Q 200 8 200 18';

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;

  // Read resolved CSS variable; fall back to a neutral stone-ish hue
  const raw =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(`--pastel-${folder.color || 'stone'}`)
          .trim()
      : '30 10% 78%';

  const lightTop        = shiftLightness(raw, +10);
  const saturatedBottom = shiftLightness(raw, -5, 1.15);

  const fgId = `fg-${folder.id}`;
  const hlId = `hl-${folder.id}`;

  return (
    <div className="group">
      {/* box-shadow lives here; backdrop-filter on child avoids the Chrome filter+backdrop bug */}
      <div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: '22px' }}>
        <button
          onClick={onClick}
          className="w-full transition-all active:scale-95 relative block"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '22px',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 200 121"
            className="w-full h-auto block"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Diagonal glass gradient: light top-left → richer bottom-right */}
              <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%"   stopColor={lightTop} />
                <stop offset="100%" stopColor={saturatedBottom} />
              </linearGradient>
              {/* White sheen overlay */}
              <linearGradient id={hlId} x1="0" y1="0" x2="0.7" y2="0.7">
                <stop offset="0%"  stopColor="white" stopOpacity="0.38" />
                <stop offset="55%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Folder body — single shape, no back flap */}
            <path
              d={FRONT_PATH}
              fill={`url(#${fgId})`}
              fillOpacity="0.85"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
            />
            {/* Diagonal white highlight overlay */}
            <path d={FRONT_PATH} fill={`url(#${hlId})`} stroke="none" />
            {/* Top-edge specular strip */}
            <path d={TOP_EDGE_PATH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Folder name + ··· menu below the card */}
      <div className="flex items-center justify-between mt-3 px-0.5">
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
      <p className="text-[11px] text-muted-foreground/70 px-0.5 mt-0.5">
        {count} {count === 1 ? 'item' : 'items'}
      </p>
    </div>
  );
}
