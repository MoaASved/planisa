import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { TaskCell } from './TaskCell';
import { cn } from '@/lib/utils';

interface SortableTaskCellProps {
  task: Task;
  onClick?: () => void;
}

export function SortableTaskCell({ task, onClick }: SortableTaskCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
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
      <TaskCell task={task} onClick={onClick} />
    </div>
  );
}
