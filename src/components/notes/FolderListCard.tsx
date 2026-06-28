import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { shiftLightness } from './FolderGridCard';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
  onEdit?: () => void;
}

// Identical paths to FolderGridCard — the mini icon reuses the same geometry,
// scaled down by the CSS width constraint (48px → viewBox 200×121).
const BACK_PATH =
  'M 6 10.2 Q 6 1.7 16 1.7 L 184 1.7 Q 194 1.7 194 10.2 L 194 108.8 L 6 108.8 Z';
const FRONT_PATH =
  'M 0 27.2 Q 0 10.2 20 10.2 L 110 10.2 Q 120 10.2 130 20.4 Q 140 30.6 150 30.6 L 184 30.6 Q 200 30.6 200 44.2 L 200 107.1 Q 200 120.7 184 120.7 L 16 120.7 Q 0 120.7 0 107.1 Z';
const TOP_EDGE_PATH =
  'M 0 27.2 Q 0 10.2 20 10.2 L 110 10.2 Q 120 10.2 130 20.4 Q 140 30.6 150 30.6 L 184 30.6 Q 200 30.6 200 44.2';

export function FolderListCard({ folder, count, onClick, onEdit }: FolderListCardProps) {
  const raw =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(`--pastel-${folder.color}`)
          .trim()
      : '160 30% 65%';

  const lightTop        = shiftLightness(raw, +10);
  const saturatedBottom = shiftLightness(raw, -5, 1.15);
  const backL           = shiftLightness(raw, -2);
  const backR           = shiftLightness(raw, -8, 1.05);

  const bgId   = `lbg-${folder.id}`;
  const fgId   = `lfg-${folder.id}`;
  const hlId   = `lhl-${folder.id}`;
  const fadeId = `lfade-${folder.id}`;
  const maskId = `lmask-${folder.id}`;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="text-left transition-all duration-200 w-full rounded-2xl p-4 bg-card border border-black/[0.04] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] active:scale-[0.98] flex items-center gap-3"
      >
        {/* Mini folder icon — same four-layer SVG as FolderGridCard, scaled to 48px */}
        <div
          className="flex-shrink-0"
          style={{ width: '48px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
        >
          <div
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <svg viewBox="0 0 200 121" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
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
                <linearGradient id={hlId} x1="0" y1="0" x2="0.7" y2="0.7">
                  <stop offset="0%"  stopColor="white" stopOpacity="0.38" />
                  <stop offset="55%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor={lightTop} />
                  <stop offset="100%" stopColor={saturatedBottom} />
                </linearGradient>
              </defs>
              <path d={BACK_PATH}     fill={`url(#${bgId})`} fillOpacity="0.92" stroke="rgba(255,255,255,0.35)" strokeWidth="1" mask={`url(#${maskId})`} />
              <path d={FRONT_PATH}    fill={`url(#${fgId})`} fillOpacity="0.87" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
              <path d={FRONT_PATH}    fill={`url(#${hlId})`} stroke="none" />
              <path d={TOP_EDGE_PATH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Name + count */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{folder.name}</p>
          <p className="text-xs leading-tight text-muted-foreground mt-0.5" style={{ opacity: 0.55 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Three-dot menu */}
        <div
          className="flex-shrink-0 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}
