import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  startOfYear,
  eachMonthOfInterval,
  eachDayOfInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar, Grid3X3, List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView, EventColor } from '@/types';
import { Header } from '@/components/navigation/Header';

const colorClasses: Record<EventColor, string> = {
  coral: 'bg-flow-coral',
  mint: 'bg-flow-mint',
  lavender: 'bg-flow-lavender',
  amber: 'bg-flow-amber',
  primary: 'bg-primary',
  rose: 'bg-flow-rose',
};

const colorBgClasses: Record<EventColor, string> = {
  coral: 'bg-flow-coral/15 text-flow-coral border-l-flow-coral',
  mint: 'bg-flow-mint/15 text-flow-mint border-l-flow-mint',
  lavender: 'bg-flow-lavender/15 text-flow-lavender border-l-flow-lavender',
  amber: 'bg-flow-amber/15 text-flow-amber border-l-flow-amber',
  primary: 'bg-primary/15 text-primary border-l-primary',
  rose: 'bg-flow-rose/15 text-flow-rose border-l-flow-rose',
};

const viewButtons: { id: CalendarView; icon: any; label: string }[] = [
  { id: 'month', icon: Grid3X3, label: 'Month' },
  { id: 'week', icon: List, label: 'Week' },
  { id: 'day', icon: Calendar, label: 'Day' },
];

export function CalendarViewComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { events, tasks } = useAppStore();

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(e.date, 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(t.date, 'yyyy-MM-dd') === dateStr);
    return { events: dayEvents, tasks: dayTasks };
  };

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-7 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
            const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'aspect-square p-1 rounded-xl flex flex-col items-center justify-start transition-all duration-200',
                  !isCurrentMonth && 'opacity-40',
                  isToday(day) && 'bg-primary text-primary-foreground',
                  isSelected && !isToday(day) && 'bg-primary/20 ring-2 ring-primary',
                  !isToday(day) && !isSelected && 'hover:bg-secondary'
                )}
              >
                <span className={cn(
                  'text-sm font-medium',
                  isToday(day) ? 'text-primary-foreground' : 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {hasItems && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 2).map((event, j) => (
                      <div 
                        key={j} 
                        className={cn('w-1.5 h-1.5 rounded-full', colorClasses[event.color])} 
                      />
                    ))}
                    {dayTasks.slice(0, 2).map((task, j) => (
                      <div 
                        key={`t-${j}`} 
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          task.completed ? 'bg-muted-foreground' : colorClasses[task.color]
                        )} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-2 animate-fade-in">
        {weekDays.map((day, i) => {
          const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
          const allItems = [...dayEvents, ...dayTasks.filter(t => t.date)];

          return (
            <div 
              key={i}
              className={cn(
                'flow-card-flat',
                isToday(day) && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex flex-col items-center justify-center',
                    isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  )}>
                    <span className="text-xs font-medium">{format(day, 'EEE')}</span>
                    <span className="text-sm font-bold leading-none">{format(day, 'd')}</span>
                  </div>
                  <span className={cn(
                    'text-sm',
                    isToday(day) ? 'font-semibold text-primary' : 'text-muted-foreground'
                  )}>
                    {isToday(day) ? 'Today' : format(day, 'MMMM d')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {allItems.length} items
                </span>
              </div>

              {allItems.length > 0 ? (
                <div className="space-y-2 ml-[52px]">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id}
                      className={cn(
                        'p-2 rounded-lg border-l-2 text-sm',
                        colorBgClasses[event.color]
                      )}
                    >
                      <span className="font-medium">{event.title}</span>
                      {event.startTime && (
                        <span className="ml-2 opacity-70">
                          {event.startTime}{event.endTime && ` - ${event.endTime}`}
                        </span>
                      )}
                    </div>
                  ))}
                  {dayTasks.filter(t => t.date).map((task) => (
                    <div 
                      key={task.id}
                      className={cn(
                        'p-2 rounded-lg text-sm flex items-center gap-2',
                        task.completed 
                          ? 'bg-secondary text-muted-foreground line-through' 
                          : colorBgClasses[task.color]
                      )}
                    >
                      <div className={cn(
                        'w-3 h-3 rounded-full border-2',
                        task.completed ? 'bg-muted-foreground border-muted-foreground' : `border-current`
                      )} />
                      <span className="font-medium">{task.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground ml-[52px]">No events</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="animate-fade-in">
        <div className="flow-card-flat mb-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex flex-col items-center justify-center',
              isToday(currentDate) ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            )}>
              <span className="text-xs font-medium">{format(currentDate, 'EEE')}</span>
              <span className="text-2xl font-bold leading-none">{format(currentDate, 'd')}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{format(currentDate, 'EEEE')}</h3>
              <p className="text-sm text-muted-foreground">{format(currentDate, 'MMMM yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {hours.slice(7, 22).map((hour) => {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            const hourEvents = dayEvents.filter(e => e.startTime?.startsWith(hour.toString().padStart(2, '0')));
            const hourTasks = dayTasks.filter(t => t.time?.startsWith(hour.toString().padStart(2, '0')));

            return (
              <div key={hour} className="flex gap-3 min-h-[48px]">
                <span className="text-xs text-muted-foreground w-12 pt-1">{timeStr}</span>
                <div className="flex-1 border-t border-border pt-1">
                  {hourEvents.map((event) => (
                    <div 
                      key={event.id}
                      className={cn(
                        'p-2 rounded-lg border-l-2 text-sm mb-1',
                        colorBgClasses[event.color]
                      )}
                    >
                      <span className="font-medium">{event.title}</span>
                    </div>
                  ))}
                  {hourTasks.map((task) => (
                    <div 
                      key={task.id}
                      className={cn(
                        'p-2 rounded-lg text-sm flex items-center gap-2 mb-1',
                        colorBgClasses[task.color]
                      )}
                    >
                      <div className="w-3 h-3 rounded-full border-2 border-current" />
                      <span className="font-medium">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <Header title="Calendar" subtitle={format(currentDate, 'MMMM yyyy')} />

      <main className="px-6 py-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
            {viewButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => setView(btn.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    view === btn.id 
                      ? 'bg-card text-foreground shadow-soft' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              className="p-2 rounded-xl bg-secondary hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={handleNext}
              className="p-2 rounded-xl bg-secondary hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flow-card-flat">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>

        {/* Selected Date Details */}
        {selectedDate && view === 'month' && (
          <div className="mt-4 animate-slide-up">
            <div className="flow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              
              {(() => {
                const { events: dayEvents, tasks: dayTasks } = getItemsForDate(selectedDate);
                const allItems = [...dayEvents, ...dayTasks];
                
                if (allItems.length === 0) {
                  return <p className="text-sm text-muted-foreground">No events or tasks</p>;
                }

                return (
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={cn(
                          'p-3 rounded-xl border-l-4',
                          colorBgClasses[event.color]
                        )}
                      >
                        <p className="font-medium">{event.title}</p>
                        {event.startTime && (
                          <p className="text-xs mt-1 opacity-70">
                            {event.startTime}{event.endTime && ` - ${event.endTime}`}
                          </p>
                        )}
                      </div>
                    ))}
                    {dayTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={cn(
                          'p-3 rounded-xl flex items-center gap-3',
                          task.completed ? 'bg-secondary' : colorBgClasses[task.color]
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2',
                          task.completed 
                            ? 'bg-muted-foreground border-muted-foreground' 
                            : 'border-current'
                        )} />
                        <span className={cn(
                          'font-medium',
                          task.completed && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
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
