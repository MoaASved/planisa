import { useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getColorGradient, getStickyTextClass } from '@/lib/colors';

interface FolderGridCardProps {
  folder: Folder;
  onClick: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

export function FolderGridCard({ folder, onClick, onEdit, compact = false }: FolderGridCardProps) {
  const { notes } = useAppStore();
  const count = notes.filter(n => n.folder === folder.name).length;
  const textClass = getStickyTextClass(folder.color);
  const gradient = getColorGradient(folder.color || 'stone');
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);

  return (
    <div className="group">
      <div className="relative">
        <button
          onPointerDown={(e) => { tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }}
          onPointerUp={(e) => {
            const s = tapStart.current;
            tapStart.current = null;
            if (!s) return;
            if (Math.abs(e.clientX - s.x) < 10 && Math.abs(e.clientY - s.y) < 10 && Date.now() - s.t < 200) onClick();
          }}
          className="w-full text-left transition-all duration-200 active:scale-[0.98] rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]"
          style={{ background: gradient, touchAction: 'manipulation' }}
        >
          <div
            className="p-4 flex flex-col justify-end h-[140px] md:h-44"
          >
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1 min-w-0 pr-1 pointer-events-none">
                <p className={`text-sm font-bold truncate leading-tight ${textClass}`}>
                  {folder.name}
                </p>
                <p className={`text-xs mt-0.5 leading-tight ${textClass} opacity-70`}>
                  {count} {count === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onPointerDown={(e) => { e.stopPropagation(); onEdit?.(); }}
                className="flex-shrink-0 p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity -mb-0.5"
                aria-label="Folder options"
              >
                <MoreHorizontal className={`w-4 h-4 ${textClass} opacity-60`} />
              </button>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
