import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-70',
      )}
    >
      <MyListRow category={category} count={count} onClick={onClick} />
    </div>
  );
}
