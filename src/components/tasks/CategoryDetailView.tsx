import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskCategory } from '@/types';
import { SwipeableTaskCard } from './SwipeableTaskCard';

interface CategoryDetailViewProps {
  category: TaskCategory;
  tasks: Task[];
  onBack: () => void;
  onToggleTask: (id: string) => void;
  onHideTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

export function CategoryDetailView({ 
  category, 
  tasks, 
  onBack, 
  onToggleTask, 
  onHideTask,
  onEditTask 
}: CategoryDetailViewProps) {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${category.color}`)} />
            <h1 className="text-xl font-semibold text-foreground">{category.name}</h1>
          </div>
          <span className="ml-auto text-sm text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="px-4 space-y-2">
        {tasks.map((task) => (
          <SwipeableTaskCard
            key={task.id}
            task={task}
            onToggle={() => onToggleTask(task.id)}
            onHide={() => onHideTask(task.id)}
            onClick={() => onEditTask(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No tasks in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
