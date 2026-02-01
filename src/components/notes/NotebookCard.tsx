import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useLongPress } from '@/hooks/useLongPress';

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
      className="flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 hover:bg-secondary/30"
    >
      {/* macOS style notebook icon */}
      <div className="w-14 h-[72px] mb-2 relative">
        {/* Notebook body */}
        <div 
          className={cn(
            'absolute inset-0 rounded-lg',
            `bg-[hsl(var(--pastel-${notebook.color}))]`
          )}
        >
          {/* Spine effect */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10 rounded-l-lg" />
          {/* Lines decoration */}
          <div className="absolute right-2 top-4 bottom-4 left-5 space-y-2">
            <div className="h-[1px] bg-black/5" />
            <div className="h-[1px] bg-black/5" />
            <div className="h-[1px] bg-black/5" />
          </div>
        </div>
        {/* Icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white/80" />
        </div>
      </div>
      
      <span className="text-sm font-medium text-center truncate max-w-[80px]">
        {notebook.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </span>
    </button>
  );
}
