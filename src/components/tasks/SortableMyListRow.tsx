import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskCategory } from '@/types';
import { MyListRow } from './MyListRow';
import { cn } from '@/lib/utils';

interface SortableMyListRowProps {
  category: TaskCategory;
  count: number;
  onClick: () => void;
}

export function SortableMyListRow({ category, count, onClick }: SortableMyListRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group/listdrag', isDragging && 'opacity-70')}
    >
      <button
        type="button"
        aria-label="Drag to reorder list"
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 p-1',
          'opacity-0 group-hover/listdrag:opacity-60 hover:!opacity-100',
          'cursor-grab active:cursor-grabbing transition-opacity touch-none',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <MyListRow category={category} count={count} onClick={onClick} />
    </div>
  );
}
