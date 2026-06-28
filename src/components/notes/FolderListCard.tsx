import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { shiftLightness } from './FolderGridCard';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
  onEdit?: () => void;
}

export function FolderListCard({ folder, count, onClick, onEdit }: FolderListCardProps) {
  const raw =
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(`--pastel-${folder.color}`)
          .trim()
      : '160 30% 65%';

  const lightTop        = shiftLightness(raw, +10);
  const saturatedBottom = shiftLightness(raw, -5, 1.15);
  const tabL            = shiftLightness(raw, -2);
  const tabR            = shiftLightness(raw, -8, 1.05);

  return (
    <div
      className="group relative"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}
    >
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-[0.98] relative text-left"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '22px',
          border: '1px solid rgba(255,255,255,0.45)',
          overflow: 'hidden',
          padding: '12px 16px',
        }}
      >
        {/* Semi-transparent gradient background — opacity < 1 so backdrop blur shows through */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${lightTop} 0%, ${saturatedBottom} 100%)`,
            opacity: 0.87,
          }}
        />

        {/* Diagonal specular highlight, same proportions as grid card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 55%)' }}
        />

        {/* Folder tab — small strip at top-right, slightly more opaque than card body.
            overflow:hidden on the button clips its right corner to the card's border-radius. */}
        <div
          className="absolute top-0 right-6 pointer-events-none"
          style={{
            width: '56px',
            height: '9px',
            background: `linear-gradient(to right, ${tabL}, ${tabR})`,
            opacity: 0.92,
            borderBottomLeftRadius: '7px',
          }}
        />

        {/* Content — sits above all overlay layers */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-800 leading-tight truncate">{folder.name}</p>
            <p className="text-[10px] leading-tight text-neutral-600 mt-0.5" style={{ opacity: 0.55 }}>
              {count} {count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div
            className="p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          >
            <MoreHorizontal className="w-4 h-4 text-neutral-600" />
          </div>
        </div>
      </button>
    </div>
  );
}
