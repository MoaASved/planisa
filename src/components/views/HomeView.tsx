import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Check, FileText, Image } from 'lucide-react';

export function HomeView() {
  const { tasks, events, notes, widgets, settings } = useAppStore();
  const today = new Date();
  const todayTasks = tasks.filter(t => t.date && isToday(new Date(t.date)));
  const todayEvents = events.filter(e => isToday(new Date(e.date)));
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedToday = todayTasks.filter(t => t.completed).length;
  const pinnedNote = notes.find(n => n.isPinned);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{getGreeting()}</h1>
          <p className="text-muted-foreground">
            {format(today, 'EEEE, MMMM d')} • {pendingTasks} tasks pending
          </p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Calendar Week Widget - Large */}
          <div className="col-span-2 flow-widget">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">This Week</h3>
            <div className="flex gap-1">
              {weekDays.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
                const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day));
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks Widget - Small */}
          <div className="flow-widget">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Today's Tasks</h3>
              <span className="text-xs text-primary font-medium">{completedToday}/{todayTasks.length}</span>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.slice(0, 3).map((task) => (
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
                {todayTasks.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{todayTasks.length - 3} more</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks for today</p>
            )}
          </div>

          {/* Highlighted Note Widget - Small */}
          <div className="flow-widget">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground">Pinned Note</h3>
            </div>
            {pinnedNote ? (
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1 truncate">{pinnedNote.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {pinnedNote.content.replace(/[#*\[\]]/g, '').slice(0, 80)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pinned notes</p>
            )}
          </div>

          {/* Today's Events Widget - Full Width */}
          <div className="col-span-2 flow-widget">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Today's Events</h3>
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
          </div>

          {/* Progress Summary */}
          <div className="col-span-2 flow-widget">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Weekly Progress</h3>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold text-primary">{tasks.filter(t => t.completed).length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pastel-amber">{pendingTasks}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pastel-mint">{events.length}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}