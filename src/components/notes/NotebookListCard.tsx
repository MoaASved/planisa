import { BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface NotebookListCardProps {
  notebook: Notebook;
  onClick: () => void;
}

export function NotebookListCard({ notebook, onClick }: NotebookListCardProps) {
  const { notebookPages } = useAppStore();
  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border',
        'transition-all duration-200 active:scale-[0.98] hover:shadow-md group'
      )}
    >
      {/* Compact notebook icon */}
      <div className={cn(
        'w-12 h-14 rounded-lg flex items-center justify-center relative flex-shrink-0',
        `bg-[hsl(var(--pastel-${notebook.color}))]`
      )}>
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-lg" />
        <BookOpen className="w-5 h-5 text-white/80" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-semibold text-foreground truncate">{notebook.name}</h4>
        <p className="text-sm text-muted-foreground">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
