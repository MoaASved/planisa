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

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;

  const hasColor = !!(folder.color && folder.color !== 'none');

  // Read resolved CSS variable for the pastel color (handles light/dark mode automatically)
  const raw = hasColor && typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement)
        .getPropertyValue(`--pastel-${folder.color}`)
        .trim()
    : '';

  const hsl = raw ? (raw.match(/[\d.]+/g) ?? []).map(Number) : null;

  // Tab: ~10% more opaque than body so the tab shape is readable without a color difference
  const tabStyle = hsl
    ? { background: `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 0.58)` }
    : {};

  // Body: light frosted tint of the pastel
  const bodyStyle = hsl
    ? { background: `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, 0.48)` }
    : {};

  return (
    <div className="group">
      {/* Drop-shadow on separate element — avoids Chrome bug with backdrop-filter */}
      <div style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.10))' }}>
        <button
          onClick={onClick}
          className="w-full active:scale-95 transition-all block"
          style={{ position: 'relative', paddingTop: '14px' }}
        >
          {/* Folder tab — peeks out above the body */}
          <div
            className={!hsl ? 'bg-neutral-300/70 dark:bg-neutral-600/60' : ''}
            style={{
              position: 'absolute',
              top: 0,
              left: '10px',
              width: '38%',
              height: '26px',
              borderRadius: '10px 10px 0 0',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 1,
              ...tabStyle,
            }}
          />

          {/* Folder body — layered on top, hiding tab bottom for a seamless join */}
          <div
            className={!hsl ? 'bg-white/70 dark:bg-white/10' : ''}
            style={{
              position: 'relative',
              paddingTop: '55%',
              borderRadius: '26px',
              border: '1px solid rgba(255,255,255,0.48)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              overflow: 'hidden',
              zIndex: 2,
              ...bodyStyle,
            }}
          >
            {/* Diagonal glass sheen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(148deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 46%)',
                borderRadius: 'inherit',
                pointerEvents: 'none',
              }}
            />
          </div>
        </button>
      </div>

      {/* Folder name + ··· on same row, below the card */}
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
