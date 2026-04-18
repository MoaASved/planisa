import { FolderOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Folder } from '@/types';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
}

export function FolderListCard({ folder, count, onClick }: FolderListCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border',
        'transition-all duration-200 active:scale-[0.98] hover:shadow-md group'
      )}
    >
      {/* Folder icon */}
      <div className={cn(
        'w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        `bg-[hsl(var(--pastel-${folder.color}))]`
      )}>
        <FolderOpen className={cn('w-6 h-6', `text-[hsl(var(--pastel-${folder.color}))]`)} />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="flow-card-title truncate">{folder.name}</h4>
        <p className="flow-meta">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
