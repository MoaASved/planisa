import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Clock,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, PastelColor } from '@/types';
import { useState } from 'react';

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'all' | 'category' | 'active' | 'completed';

const priorityColors = {
  none: 'text-muted-foreground',
  low: 'text-pastel-mint',
  medium: 'text-pastel-amber',
  high: 'text-pastel-coral',
};

export function TasksView() {
  const { tasks, toggleTask, toggleSubtask, searchQuery, taskCategories } = useAppStore();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortType>('all');

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const filteredTasks = tasks
    .filter(task => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(query) || 
               task.category.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(task => {
      if (sortBy === 'active') return !task.completed;
      if (sortBy === 'completed') return task.completed;
      return true;
    });

  const groupedTasks: Record<string, Task[]> = sortBy === 'category' 
    ? taskCategories.reduce((acc, cat) => {
        const catTasks = filteredTasks.filter(t => t.category === cat.name);
        if (catTasks.length > 0) acc[cat.name] = catTasks;
        return acc;
      }, {} as Record<string, Task[]>)
    : { 'All Tasks': filteredTasks };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        {/* Sort Controls */}
        <div className="flow-segment mb-4">
          {(['all', 'category', 'active', 'completed'] as SortType[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn('flow-segment-item capitalize', sortBy === s && 'flow-segment-item-active')}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="flow-card-flat mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm font-semibold text-primary">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Task Groups */}
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <div key={group}>
              {sortBy === 'category' && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
                  <span className="text-xs text-muted-foreground">
                    {groupTasks.filter(t => t.completed).length}/{groupTasks.length}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {groupTasks.map((task) => (
                  <div key={task.id} className="flow-card-flat">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          'mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0',
                          task.completed 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground hover:border-primary'
                        )}
                      >
                        {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'font-medium transition-all duration-200',
                            task.completed && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1">
                            {task.priority !== 'none' && (
                              <Flag className={cn('w-4 h-4', priorityColors[task.priority])} />
                            )}
                            {task.subtasks.length > 0 && (
                              <button
                                onClick={() => toggleExpanded(task.id)}
                                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                              >
                                {expandedTasks.has(task.id) 
                                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> 
                                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                }
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn('flow-badge', `flow-badge-${task.color}`)}>
                            {task.category}
                          </span>
                          {task.date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {isToday(new Date(task.date)) ? 'Today' : format(new Date(task.date), 'MMM d')}
                            </span>
                          )}
                          {task.time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {task.time}
                            </span>
                          )}
                        </div>

                        {/* Subtasks */}
                        {expandedTasks.has(task.id) && task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-2 animate-fade-in">
                            {task.subtasks.map((subtask) => (
                              <button
                                key={subtask.id}
                                onClick={() => toggleSubtask(task.id, subtask.id)}
                                className="flex items-center gap-2 w-full text-left pl-2"
                              >
                                <div className={cn(
                                  'w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                                  subtask.completed 
                                    ? 'bg-primary/60 border-primary/60' 
                                    : 'border-muted-foreground'
                                )}>
                                  {subtask.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                                </div>
                                <span className={cn(
                                  'text-sm',
                                  subtask.completed && 'line-through text-muted-foreground'
                                )}>
                                  {subtask.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No tasks to show</p>
          </div>
        )}
      </div>
    </div>
  );
}