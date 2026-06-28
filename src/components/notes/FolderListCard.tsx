import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { shiftLightness } from './FolderGridCard';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
  onEdit?: () => void;
}

// Landscape paths for a 400×84 viewBox — same visual language as FolderGridCard
// but adapted to a wide/short card. Horizontal scale ×2, vertical scale ×0.695
// relative to the grid card's 200×121 viewBox, so all proportions match exactly.
//
// Tab is on the left-top (y=7, ~8.4% from top), same as the grid card.
// Notch steps down to y=21 (~25%), and the top-right corner ends at y=37 (~44%).
// These match the grid card's 10.2/121, 30.6/121, 44.2/121 proportions.
const LIST_BACK_PATH =
  'M 6 8 Q 6 1 16 1 L 384 1 Q 394 1 394 8 L 394 76 L 6 76 Z';
const LIST_FRONT_PATH =
  'M 0 19 Q 0 7 40 7 L 220 7 Q 240 7 260 14 Q 280 21 300 21 L 368 21 Q 400 21 400 37 L 400 72 Q 400 84 368 84 L 32 84 Q 0 84 0 72 Z';
const LIST_TOP_EDGE_PATH =
  'M 0 19 Q 0 7 40 7 L 220 7 Q 240 7 260 14 Q 280 21 300 21 L 368 21 Q 400 21 400 37';

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
    <div
      className="group relative"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}
    >
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
        <svg viewBox="0 0 400 84" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Same fade mask as the grid card — back panel dissolves before the bottom */}
            <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="84" gradientUnits="userSpaceOnUse">
              <stop offset="0%"  stopColor="white" stopOpacity="1" />
              <stop offset="33%" stopColor="white" stopOpacity="1" />
              <stop offset="60%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id={maskId}>
              <path d={LIST_BACK_PATH} fill={`url(#${fadeId})`} />
            </mask>
            {/* Back panel: L→R slightly deeper, same as grid card */}
            <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={backL} />
              <stop offset="100%" stopColor={backR} />
            </linearGradient>
            {/* Specular highlight: diagonal white sheen */}
            <linearGradient id={hlId} x1="0" y1="0" x2="0.7" y2="0.7">
              <stop offset="0%"  stopColor="white" stopOpacity="0.38" />
              <stop offset="55%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            {/* Front card: diagonal top-left → bottom-right */}
            <linearGradient id={fgId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor={lightTop} />
              <stop offset="100%" stopColor={saturatedBottom} />
            </linearGradient>
          </defs>

          <path d={LIST_BACK_PATH}     fill={`url(#${bgId})`} fillOpacity="0.92" stroke="rgba(255,255,255,0.35)" strokeWidth="1" mask={`url(#${maskId})`} />
          <path d={LIST_FRONT_PATH}    fill={`url(#${fgId})`} fillOpacity="0.87" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
          <path d={LIST_FRONT_PATH}    fill={`url(#${hlId})`} stroke="none" />
          <path d={LIST_TOP_EDGE_PATH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
        </svg>

        {/* Name + count — bottom-left, same layout as FolderGridCard */}
        <div className="absolute bottom-0 left-0 right-8 px-2.5 pb-2 pointer-events-none text-left">
          <p className="text-xs font-semibold text-neutral-800 leading-tight truncate">{folder.name}</p>
          <p className="text-[10px] leading-tight text-neutral-600 mt-0.5" style={{ opacity: 0.55 }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Three-dot menu — bottom-right, same as FolderGridCard */}
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
