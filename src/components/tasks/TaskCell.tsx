import { useState } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Star, Calendar as CalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { useHaptics } from '@/hooks/useHaptics';

interface TaskCellProps {
  task: Task;
  onClick?: () => void;
  showListDot?: boolean;
}

function formatDate(d: Date) {
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function TaskCell({ task, onClick, showListDot = false }: TaskCellProps) {
  const { toggleTask, updateTask } = useAppStore();
  const haptics = useHaptics();
  const isPriority = task.priority !== 'none';
  const today = new Date().setHours(0, 0, 0, 0);
  const isOverdue =
    !task.completed && task.date && new Date(task.date).setHours(0, 0, 0, 0) < today;

  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.completed).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full bg-card rounded-2xl px-4 py-3 text-left transition-all',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]',
        'hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]',
        'active:scale-[0.995]',
      )}
    >
      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
          <AnimatedCheckbox checked={task.completed} onChange={() => toggleTask(task.id)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                'flex-1 text-[15px] font-medium leading-snug truncate',
                task.completed ? 'text-muted-foreground line-through' : 'text-foreground',
              )}
            >
              {task.title}
            </p>
            {isPriority && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mt-1 flex-shrink-0" />
            )}
          </div>

          {task.note && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{task.note}</p>
          )}

          {(task.date || task.time || subtaskTotal > 0 || (showListDot && task.category)) && (
            <div className="mt-1.5 flex items-center gap-2.5 flex-wrap">
              {showListDot && task.category && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className={cn('w-1.5 h-1.5 rounded-full', `bg-pastel-${task.color}`)} />
                  {task.category}
                </span>
              )}
              {task.date && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-[11px]',
                    isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground',
                  )}
                >
                  <CalIcon className="w-3 h-3" />
                  {formatDate(new Date(task.date))}
                  {task.time && ` · ${task.time}`}
                </span>
              )}
              {subtaskTotal > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {subtaskDone}/{subtaskTotal}
                </span>
              )}
            </div>
          )}
        </div>

        {!isPriority && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateTask(task.id, { priority: 'high' });
              haptics.success();
            }}
            className="p-1 -m-1 text-muted-foreground/30 hover:text-amber-500 transition-colors"
            aria-label="Mark priority"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </button>
  );
}
