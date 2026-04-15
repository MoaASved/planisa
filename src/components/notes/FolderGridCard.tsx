import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
}

export function FolderGridCard({ folder, onClick, onEdit }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const color = `hsl(var(--pastel-${folder.color}, 160 30% 65%))`;

  return (
    <button
      onClick={onClick}
      className="w-full transition-all active:scale-95 relative"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
    >
      <svg viewBox="0 0 200 260" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-${folder.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
          <clipPath id={`clip-${folder.id}`}>
            <path d="
              M 0 32
              Q 0 24, 8 24
              L 50 24
              Q 56 24, 58 18
              L 64 6
              Q 66 0, 72 0
              L 88 0
              Q 94 0, 96 6
              L 102 18
              Q 104 24, 110 24
              L 192 24
              Q 200 24, 200 32
              L 200 252
              Q 200 260, 192 260
              L 8 260
              Q 0 260, 0 252
              Z
            " />
          </clipPath>
        </defs>

        {/* Folder body */}
        <rect
          x="0" y="0" width="200" height="260"
          clipPath={`url(#clip-${folder.id})`}
          fill={color}
        />

        {/* Bottom gradient overlay */}
        <rect
          x="0" y="160" width="200" height="100"
          clipPath={`url(#clip-${folder.id})`}
          fill="url(#grad-overlay)"
          style={{ opacity: 1 }}
        />
        <defs>
          <linearGradient id="grad-overlay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
        </defs>

        {/* Folder name */}
        <text x="14" y="232" fill="white" fontWeight="700" fontSize="15" fontFamily="system-ui, sans-serif">
          {folder.name.length > 16 ? folder.name.slice(0, 15) + '…' : folder.name}
        </text>

        {/* Item count */}
        <text x="14" y="248" fill="rgba(255,255,255,0.75)" fontSize="12" fontFamily="system-ui, sans-serif">
          {count} {count === 1 ? 'item' : 'items'}
        </text>
      </svg>

      {/* Three-dot menu bottom-right */}
      <div
        className="absolute bottom-3 right-3 z-10 p-1"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
        style={{ cursor: 'pointer' }}
      >
        <MoreHorizontal className="w-5 h-5" style={{ color: '#fff' }} />
      </div>
    </button>
  );
}
