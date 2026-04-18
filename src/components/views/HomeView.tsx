import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { tasks, events, settings } = useAppStore();
  const today = new Date();
  const todayTasks = tasks.filter(t => t.date && isToday(new Date(t.date)) && !t.hidden);
  const todayEvents = events.filter(e => isToday(new Date(e.date)));
  const completedToday = todayTasks.filter(t => t.completed).length;

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const userName = settings.name?.trim();

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="flow-page-title">
            {userName ? `Hej, ${userName}` : 'Hej'}
          </h1>
          <p className="flow-meta mt-1">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 gap-3">
          {/* Calendar Week Widget - Clickable */}
          <button 
            onClick={() => onNavigate('calendar')}
            className="flow-widget text-left w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="flow-section-title">This Week</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-1">
              {weekDays.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
                const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day) && !t.hidden);
                const hasItems = dayEvents.length > 0 || dayTasks.length > 0;

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 p-2 rounded-xl text-center transition-all',
                      isToday(day) && 'bg-primary text-primary-foreground',
                      !isToday(day) && 'bg-secondary'
                    )}
                  >
                    <span className="text-xs font-medium block">{format(day, 'EEE')}</span>
                    <span className="text-lg font-semibold">{format(day, 'd')}</span>
                    {hasItems && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {dayEvents.slice(0, 2).map((e, j) => (
                          <div key={j} className={cn('w-1.5 h-1.5 rounded-full', isToday(day) ? 'bg-primary-foreground/60' : `bg-pastel-${e.color}`)} />
                        ))}
                        {dayTasks.slice(0, 2 - dayEvents.slice(0, 2).length).map((t, j) => (
                          <div key={`t-${j}`} className={cn('w-1.5 h-1.5 rounded-full', isToday(day) ? 'bg-primary-foreground/60' : `bg-pastel-${t.color}`)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </button>

          {/* Today's Tasks Widget - Clickable */}
          <button 
            onClick={() => onNavigate('tasks')}
            className="flow-widget text-left w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="flow-section-title">Today's Tasks</h3>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-primary font-medium tabular-nums">{completedToday}/{todayTasks.length}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className={cn(
                      'w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                      task.completed ? 'bg-primary border-primary' : `border-pastel-${task.color}`
                    )}>
                      {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={cn('text-sm truncate', task.completed && 'line-through text-muted-foreground')}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {todayTasks.length > 4 && (
                  <p className="text-xs text-muted-foreground">+{todayTasks.length - 4} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks for today</p>
            )}
          </button>

          {/* Today's Events Widget - Clickable */}
          <button 
            onClick={() => onNavigate('calendar')}
            className="flow-widget text-left w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="flow-section-title">Today's Events</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <div key={event.id} className={cn('p-3 rounded-xl border-l-4', `bg-pastel-${event.color}/20 border-pastel-${event.color}`)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{event.title}</span>
                      {event.startTime && (
                        <span className="text-xs text-muted-foreground">{event.startTime}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events today</p>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
