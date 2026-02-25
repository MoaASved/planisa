import { MoreHorizontal } from 'lucide-react';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
  onEdit?: () => void;
}

export function NotebookCard({ notebook, onClick, onEdit }: NotebookCardProps) {
  const { notebookPages } = useAppStore();
  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-[14px] overflow-hidden transition-all active:scale-95 relative"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <AspectRatio ratio={1 / 1.4}>
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `hsl(var(--pastel-${notebook.color}, 160 30% 65%))` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 65%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 p-3 text-left">
          <h4 className="font-bold text-[15px] leading-tight" style={{ color: '#fff' }}>
            {notebook.name}
          </h4>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <div
          className="absolute bottom-2 right-2 z-10 p-1"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
          style={{ cursor: 'pointer' }}
        >
          <MoreHorizontal className="w-5 h-5" style={{ color: '#fff' }} />
        </div>
      </AspectRatio>
    </button>
  );
}
