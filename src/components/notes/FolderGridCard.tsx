import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
}

export function FolderGridCard({ folder, onClick, onEdit }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[14px] overflow-hidden transition-all active:scale-95 relative"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <AspectRatio ratio={1 / 1.4}>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `hsl(var(--pastel-${folder.color}, 160 30% 65%))` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 65%, rgba(0,0,0,0.35) 100%)',
          }}
        />

        {/* Folder icon top-left */}
        <div className="absolute top-3 left-3">
          <svg viewBox="0 0 80 64" className="w-10 h-8" style={{ opacity: 0.5 }}>
            <path
              d="M4 12 L4 60 C4 62 6 64 8 64 L72 64 C74 64 76 62 76 60 L76 16 C76 14 74 12 72 12 L36 12 L32 6 C31 4 29 4 28 4 L8 4 C6 4 4 6 4 8 L4 12 Z"
              fill="rgba(255,255,255,0.7)"
            />
            <path
              d="M4 16 L76 16 L76 60 C76 62 74 64 72 64 L8 64 C6 64 4 62 4 60 L4 16 Z"
              fill="rgba(255,255,255,0.9)"
            />
          </svg>
        </div>

        {/* Three-dot menu top-right */}
        <div
          className="absolute top-2 right-2 z-10 p-1"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          style={{ cursor: 'pointer' }}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: '#fff' }} />
        </div>

        {/* Name + count bottom-left */}
        <div className="absolute bottom-0 left-0 p-3 text-left">
          <h4 className="font-bold text-[15px] leading-tight" style={{ color: '#fff' }}>
            {folder.name}
          </h4>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
      </AspectRatio>
    </button>
  );
}
