import { ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notebook, PastelColor } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
}

export function NotebookCard({ notebook, onClick }: NotebookCardProps) {
  const { notebookPages } = useAppStore();
  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  return (
    <button
      onClick={onClick}
      className="flow-card text-left group w-full"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-14 h-16 rounded-xl flex items-center justify-center relative overflow-hidden',
          `bg-pastel-${notebook.color}/30`
        )}>
          {/* Notebook spine effect */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
          <BookOpen className={cn('w-6 h-6 ml-1', `text-pastel-${notebook.color}`)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{notebook.name}</h4>
          <p className="text-sm text-muted-foreground">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
}