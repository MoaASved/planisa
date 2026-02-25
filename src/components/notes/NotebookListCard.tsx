import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useLongPress } from '@/hooks/useLongPress';

interface NotebookListCardProps {
  notebook: Notebook;
  onClick: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
}

export function NotebookListCard({ notebook, onClick, onLongPress, onEdit }: NotebookListCardProps) {
  const { notebookPages } = useAppStore();
  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress?.(),
    onClick: onClick,
    delay: 500,
  });

  return (
    <button
      {...longPressHandlers}
      className="w-full flex items-center rounded-[14px] overflow-hidden transition-all duration-200 active:scale-[0.98]"
      style={{
        height: 72,
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Color bar */}
      <div
        className="h-full flex-shrink-0"
        style={{
          width: 8,
          backgroundColor: `hsl(var(--pastel-${notebook.color}, 160 30% 65%))`,
          borderRadius: '4px 0 0 4px',
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0 text-left pl-4">
        <h4 className="font-bold text-[16px] leading-tight" style={{ color: '#1C1C1E' }}>
          {notebook.name}
        </h4>
        <p className="text-[13px] mt-0.5" style={{ color: '#8E8E93' }}>
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </p>
      </div>

      {/* Chevron */}
      <div className="pr-2">
        <ChevronRight className="w-5 h-5" style={{ color: '#C7C7CC' }} />
      </div>

      {/* Three-dot menu */}
      <div
        className="pr-4"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEdit?.();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer' }}
      >
        <MoreHorizontal className="w-5 h-5" style={{ color: '#C7C7CC' }} />
      </div>
    </button>
  );
}
