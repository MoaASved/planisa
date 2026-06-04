import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const baseColor = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;
  const lighterColor = `color-mix(in srgb, ${baseColor} 55%, hsl(var(--card)))`;

  // Compact variant: subfolder inside a folder view
  if (compact) {
    return (
      <div
        className="group w-full relative md:h-44 md:overflow-hidden md:rounded-[12px]"
        style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}
      >
        <button
          onClick={onClick}
          className="w-full transition-all active:scale-95 relative rounded-[12px] md:rounded-none"
        >
          <svg viewBox="0 0 200 150" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`fill-${folder.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lighterColor} />
                <stop offset="100%" stopColor={baseColor} />
              </linearGradient>
            </defs>
            <rect x="55" y="20" width="120" height="100" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.55" transform="rotate(2, 115, 70)" />
            <rect x="50" y="22" width="115" height="98" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.7" transform="rotate(-1.5, 107, 71)" />
            <rect x="60" y="18" width="110" height="102" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.45" transform="rotate(3.5, 115, 69)" />
            <path d="M 8 40 Q 0 40, 0 48 L 0 142 Q 0 150, 8 150 L 192 150 Q 200 150, 200 142 L 200 40 Q 200 32, 192 32 L 80 32 Q 74 32, 72 26 L 68 14 Q 66 8, 60 8 L 16 8 Q 8 8, 8 16 Z" fill={`url(#fill-${folder.id})`} />
            {/* Name and count — mobile only */}
            <text x="12" y="122" fill="#2C2C2A" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif" className="md:hidden">
              {folder.name.length > 18 ? folder.name.slice(0, 17) + '…' : folder.name}
            </text>
            <text x="12" y="136" fill="rgba(44,44,42,0.7)" fontSize="11" fontFamily="system-ui, sans-serif" className="md:hidden">
              {count} {count === 1 ? 'item' : 'items'}
            </text>
          </svg>
          {/* Three-dot — mobile only */}
          <div
            className="absolute bottom-2 right-2 z-10 p-1 md:hidden"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
            style={{ cursor: 'pointer' }}
          >
            <MoreHorizontal className="w-5 h-5" style={{ color: '#2C2C2A' }} />
          </div>
        </button>

        {/* Desktop only: name + count + three-dot at bottom of h-44 */}
        <div
          className="hidden md:flex absolute bottom-0 left-0 right-0 items-end justify-between px-3 pb-2 pt-8 pointer-events-none"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{folder.name}</p>
            <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
          <div
            className="flex-shrink-0 p-1 pointer-events-auto cursor-pointer"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          >
            <MoreHorizontal className="w-5 h-5 text-foreground/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <button
        onClick={onClick}
        className="w-full transition-all active:scale-95 relative rounded-[12px]"
        style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}
      >
        <svg viewBox="0 0 200 150" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`fill-${folder.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lighterColor} />
              <stop offset="100%" stopColor={baseColor} />
            </linearGradient>
          </defs>

          {/* Papers sticking out */}
          <rect x="55" y="20" width="120" height="100" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.55" transform="rotate(2, 115, 70)" />
          <rect x="50" y="22" width="115" height="98" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.7" transform="rotate(-1.5, 107, 71)" />
          <rect x="60" y="18" width="110" height="102" rx="3" style={{ fill: 'hsl(var(--card))' }} opacity="0.45" transform="rotate(3.5, 115, 69)" />

          {/* Folder body with soft same-color gradient */}
          <path
            d="M 8 40 Q 0 40, 0 48 L 0 142 Q 0 150, 8 150 L 192 150 Q 200 150, 200 142 L 200 40 Q 200 32, 192 32 L 80 32 Q 74 32, 72 26 L 68 14 Q 66 8, 60 8 L 16 8 Q 8 8, 8 16 Z"
            fill={`url(#fill-${folder.id})`}
          />

          {/* Folder name — hidden on desktop, shown below the card instead */}
          <text x="12" y="122" fill="#2C2C2A" fontWeight="700" fontSize="14" fontFamily="system-ui, sans-serif" className="md:hidden">
            {folder.name.length > 18 ? folder.name.slice(0, 17) + '…' : folder.name}
          </text>

          {/* Item count — hidden on desktop */}
          <text x="12" y="136" fill="rgba(44,44,42,0.7)" fontSize="11" fontFamily="system-ui, sans-serif" className="md:hidden">
            {count} {count === 1 ? 'item' : 'items'}
          </text>
        </svg>

        {/* Three-dot menu — mobile only, inside the card */}
        <div
          className="absolute bottom-2 right-2 z-10 p-1 md:hidden"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          style={{ cursor: 'pointer' }}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: '#2C2C2A' }} />
        </div>
      </button>

      {/* Desktop only: name, count and hover-revealed ... below the card */}
      <div className="hidden md:flex items-center justify-between mt-2 px-0.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{folder.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary ml-2 flex-shrink-0"
        >
          <MoreHorizontal className="w-4 h-4 text-foreground/60" />
        </button>
      </div>
    </div>
  );
}
