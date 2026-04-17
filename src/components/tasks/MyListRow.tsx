import { ChevronRight, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCategory } from '@/types';

interface MyListRowProps {
  category: TaskCategory;
  count: number;
  onClick: () => void;
}

export function MyListRow({ category, count, onClick }: MyListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-2xl',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        'hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] active:scale-[0.99] transition-all',
      )}
    >
      <span className={cn('w-3 h-3 rounded-full flex-shrink-0', `bg-pastel-${category.color}`)} />
      <span className="flex-1 text-left text-[15px] font-medium text-foreground truncate">
        {category.name}
      </span>
      {category.pinned && (
        <Pin className="w-3.5 h-3.5 text-muted-foreground/60 fill-muted-foreground/30" />
      )}
      <span className="text-sm text-muted-foreground tabular-nums">{count}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
    </button>
  );
}
