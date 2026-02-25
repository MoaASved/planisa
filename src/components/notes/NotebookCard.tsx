import { cn } from '@/lib/utils';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useLongPress } from '@/hooks/useLongPress';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
  onLongPress?: () => void;
}

export function NotebookCard({ notebook, onClick, onLongPress }: NotebookCardProps) {
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
      className="w-full rounded-[14px] overflow-hidden transition-all active:scale-95 relative"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <AspectRatio ratio={1 / 1.4}>
        {/* Full color background */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `hsl(var(--pastel-${notebook.color}, 160 30% 65%))` }}
        />
        {/* Gradient overlay on bottom 35% */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 65%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {/* Text content */}
        <div className="absolute bottom-0 left-0 p-3 text-left">
          <h4 className="font-bold text-[15px] leading-tight" style={{ color: '#fff' }}>
            {notebook.name}
          </h4>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </p>
        </div>
      </AspectRatio>
    </button>
  );
}
