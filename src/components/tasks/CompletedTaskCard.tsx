import { Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface CompletedTaskCardProps {
  task: Task;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
}

export function CompletedTaskCard({ task, onHide, onUnhide, onDelete }: CompletedTaskCardProps) {
  return (
    <div className="flow-card-flat relative bg-card opacity-60 rounded-2xl">
      <div className="flex items-center justify-between">
        {/* Left: Checkbox + title */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-primary border-2 border-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground line-through">
              {task.title}
            </p>
            {task.category && (
              <span className={cn('flow-badge mt-1', `flow-badge-${task.color}`)}>
                {task.category}
              </span>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {/* Toggle hide/show button */}
          <button
            onClick={task.hidden ? onUnhide : onHide}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title={task.hidden ? "Show in tasks list" : "Hide from tasks list"}
          >
            {task.hidden 
              ? <Eye className="w-4 h-4 text-muted-foreground" />
              : <EyeOff className="w-4 h-4 text-muted-foreground" />
            }
          </button>
          
          {/* Delete permanently */}
          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
            title="Delete permanently"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
