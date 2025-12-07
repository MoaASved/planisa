import { useState } from 'react';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { 
  Check, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Tag,
  Filter,
  SortAsc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, TaskColor } from '@/types';
import { Header } from '@/components/navigation/Header';

const colorClasses: Record<TaskColor, string> = {
  coral: 'bg-flow-coral',
  mint: 'bg-flow-mint',
  lavender: 'bg-flow-lavender',
  amber: 'bg-flow-amber',
  primary: 'bg-primary',
};

const colorBadgeClasses: Record<TaskColor, string> = {
  coral: 'flow-badge-coral',
  mint: 'flow-badge-mint',
  lavender: 'flow-badge-lavender',
  amber: 'flow-badge-amber',
  primary: 'flow-badge-primary',
};

type GroupBy = 'date' | 'category' | 'priority';

export function TasksView() {
  const { tasks, toggleTask, toggleSubtask, searchQuery } = useAppStore();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');

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
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    });

  const groupTasks = (tasks: Task[]): Record<string, Task[]> => {
    const groups: Record<string, Task[]> = {};

    tasks.forEach(task => {
      let key: string;
      
      if (groupBy === 'date') {
        if (!task.date) key = 'No date';
        else if (isToday(task.date)) key = 'Today';
        else if (isTomorrow(task.date)) key = 'Tomorrow';
        else if (isPast(task.date)) key = 'Overdue';
        else key = format(task.date, 'EEEE, MMM d');
      } else if (groupBy === 'category') {
        key = task.category || 'Uncategorized';
      } else {
        key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1) + ' priority';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  };

  const groupedTasks = groupTasks(filteredTasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === 'Today' || dateStr === 'Tomorrow' || dateStr === 'Overdue' || dateStr === 'No date') {
      return dateStr;
    }
    return dateStr;
  };

  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="Tasks" 
        subtitle={`${completedTasks} of ${totalTasks} completed`} 
      />

      <main className="px-6 py-4">
        {/* Filter & Group Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize',
                  filter === f 
                    ? 'bg-card text-foreground shadow-soft' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setGroupBy(groupBy === 'date' ? 'category' : groupBy === 'category' ? 'priority' : 'date')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-muted transition-colors text-sm"
            >
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{groupBy}</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flow-card-flat mb-4 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Today's progress</span>
            <span className="text-sm font-semibold text-primary">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Task Groups */}
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([group, groupTasks], groupIndex) => (
            <div key={group} className="animate-fade-up" style={{ animationDelay: `${groupIndex * 0.05}s` }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={cn(
                  'text-sm font-semibold',
                  group === 'Overdue' ? 'text-destructive' : 
                  group === 'Today' ? 'text-primary' : 
                  'text-muted-foreground'
                )}>
                  {formatDateLabel(group)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {groupTasks.filter(t => t.completed).length}/{groupTasks.length}
                </span>
              </div>

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

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn('flow-badge', colorBadgeClasses[task.color])}>
                            {task.category}
                          </span>
                          {task.date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {isToday(task.date) ? 'Today' : format(task.date, 'MMM d')}
                            </span>
                          )}
                          {task.time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {task.time}
                            </span>
                          )}
                          {task.subtasks.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
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
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No tasks to show</p>
          </div>
        )}
      </main>

      {/* FAB */}
      <button className="fixed right-6 bottom-24 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-elevated flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
