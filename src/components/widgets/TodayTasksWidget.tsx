import { format, isToday } from 'date-fns';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function TodayTasksWidget() {
  const { tasks, toggleTask } = useAppStore();

  const todayTasks = tasks
    .filter(task => task.date && isToday(task.date))
    .slice(0, 4);

  const completedCount = todayTasks.filter(t => t.completed).length;

  return (
    <div className="flow-widget h-full animate-fade-up stagger-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Today's Tasks</h3>
        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {completedCount}/{todayTasks.length}
        </span>
      </div>

      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Check className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">No tasks for today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
                task.completed 
                  ? 'bg-secondary/50' 
                  : 'bg-secondary hover:bg-muted'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                task.completed 
                  ? 'bg-primary border-primary' 
                  : 'border-muted-foreground'
              )}>
                {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className={cn(
                'text-sm font-medium flex-1 text-left transition-all duration-200',
                task.completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
              {task.time && (
                <span className="text-xs text-muted-foreground">{task.time}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
