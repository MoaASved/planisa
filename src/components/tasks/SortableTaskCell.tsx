import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Task } from '@/types';
import { TaskCell } from './TaskCell';
import { cn } from '@/lib/utils';

interface SortableTaskCellProps {
  task: Task;
  onClick?: () => void;
  draggable: boolean;
}

export function SortableTaskCell({ task, onClick, draggable }: SortableTaskCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!draggable) {
    return <TaskCell task={task} onClick={onClick} />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group/drag', isDragging && 'opacity-70')}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 p-1',
          'opacity-0 group-hover/drag:opacity-60 hover:!opacity-100',
          'cursor-grab active:cursor-grabbing transition-opacity',
          'touch-none',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <TaskCell task={task} onClick={onClick} />
    </div>
  );
}
