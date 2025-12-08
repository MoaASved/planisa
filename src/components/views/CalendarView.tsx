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
  eachDayOfInterval,
  getWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView, PastelColor, Task, CalendarEvent } from '@/types';

const viewButtons: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
];

export function CalendarViewComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { events, tasks, toggleTask, taskCategories, eventCategories } = useAppStore();

  // Get effective color: manual color > category color
  const getItemColor = (item: Task | CalendarEvent, type: 'task' | 'event'): PastelColor => {
    // If item has a manually set color, use it
    if (item.color) return item.color;
    
    // Otherwise, find category and use its color
    if (type === 'task') {
      const task = item as Task;
      const category = taskCategories.find(c => c.name === task.category);
      return category?.color || 'sky';
    } else {
      const event = item as CalendarEvent;
      const category = eventCategories.find(c => c.name === event.category);
      return category?.color || 'sky';
    }
  };

  // Check if a color is dark (needs white text) - pastel colors are generally light
  const isDarkColor = (_color: PastelColor): boolean => {
    // All pastel colors in this palette are light, so we don't need white text
    return false;
  };

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
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

  const handleItemClick = (item: Task | CalendarEvent, type: 'task' | 'event') => {
    // TODO: Open detail modal for the item
    console.log('Opening', type, item);
  };

  const handleTaskToggle = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    toggleTask(taskId);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks for week numbers
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-8 mb-2">
          <div className="text-center text-[10px] font-normal text-muted-foreground/50 py-2">W</div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-8 gap-0.5">
            {/* Week number - more subtle */}
            <div className="aspect-square flex items-center justify-center text-[10px] font-normal text-muted-foreground/40">
              {getWeek(week[0], { weekStartsOn: 1 })}
            </div>
            
            {week.map((day, dayIndex) => {
              const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
              const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dayIndex}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square p-0.5 rounded-xl flex flex-col items-center justify-center transition-all duration-200',
                    !isCurrentMonth && 'opacity-30',
                    isToday(day) && 'bg-primary text-primary-foreground',
                    isSelected && !isToday(day) && 'bg-primary/20 ring-2 ring-primary',
                    !isToday(day) && !isSelected && 'hover:bg-secondary'
                  )}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {hasItems && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 2).map((event, j) => (
                        <div key={j} className={cn('w-1 h-1 rounded-full', `bg-pastel-${getItemColor(event, 'event')}`)} />
                      ))}
                      {dayTasks.filter(t => !t.completed).slice(0, 2).map((task, j) => (
                        <div key={`t-${j}`} className={cn('w-1 h-1 rounded-full', `bg-pastel-${getItemColor(task, 'task')}`)} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

    return (
      <div className="animate-fade-in">
        {/* Horizontal dates - no shadow on tap, only highlight current day */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'flex-1 min-w-[48px] p-2 rounded-xl text-center transition-colors',
                isToday(day) && 'bg-primary text-primary-foreground',
                !isToday(day) && 'bg-secondary hover:bg-secondary/80'
              )}
            >
              <span className="text-xs font-medium block">{format(day, 'EEE')}</span>
              <span className="text-lg font-semibold">{format(day, 'd')}</span>
            </button>
          ))}
        </div>

        {/* Events list */}
        <div className="space-y-2">
          {weekDays.map((day, i) => {
            const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
            if (dayEvents.length === 0 && dayTasks.length === 0) return null;

            return (
              <div key={i} className="mb-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  {isToday(day) ? 'Today' : format(day, 'EEEE, MMM d')}
                </h4>
                <div className="space-y-2">
                  {dayEvents.map((event) => {
                    const color = getItemColor(event, 'event');
                    const dark = isDarkColor(color);
                    return (
                      <button
                        key={event.id}
                        onClick={() => handleItemClick(event, 'event')}
                        className={cn(
                          'w-full text-left p-3 rounded-xl transition-all active:scale-[0.98]',
                          `bg-pastel-${color}/90`
                        )}
                      >
                        <span className={cn('font-medium text-sm', dark ? 'text-white' : 'text-foreground')}>{event.title}</span>
                        {event.startTime && (
                          <span className={cn('text-xs ml-2', dark ? 'text-white/70' : 'text-foreground/60')}>{event.startTime}</span>
                        )}
                      </button>
                    );
                  })}
                  {dayTasks.map((task) => {
                    const color = getItemColor(task, 'task');
                    const dark = isDarkColor(color);
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleItemClick(task, 'task')}
                        className={cn(
                          'w-full text-left p-3 rounded-xl text-sm flex items-center gap-3 transition-all active:scale-[0.98]',
                          task.completed ? 'bg-secondary' : `bg-pastel-${color}/90`
                        )}
                      >
                        <div
                          onClick={(e) => handleTaskToggle(e, task.id)}
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0',
                            task.completed
                              ? 'bg-primary border-primary'
                              : dark ? 'border-white/60 hover:bg-white/20' : 'border-foreground/40 hover:bg-foreground/10'
                          )}
                        >
                          {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className={cn(
                          task.completed ? 'line-through text-muted-foreground' : dark ? 'text-white' : 'text-foreground'
                        )}>
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDate(currentDate);
    const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });

    return (
      <div className="animate-fade-in">
        <div className="flow-card-flat mb-4 text-center">
          <span className="text-4xl font-bold text-foreground">{format(currentDate, 'd')}</span>
          <p className="text-sm text-muted-foreground mt-1">{format(currentDate, 'EEEE, MMMM yyyy')}</p>
        </div>

        <div className="space-y-2">
          {dayEvents.length === 0 && dayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events or tasks for this day
            </div>
          ) : (
            <>
              {dayEvents.map((event) => {
                const color = getItemColor(event, 'event');
                const dark = isDarkColor(color);
                return (
                  <button
                    key={event.id}
                    onClick={() => handleItemClick(event, 'event')}
                    className={cn(
                      'w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]',
                      `bg-pastel-${color}/90`
                    )}
                  >
                    <h4 className={cn('font-semibold', dark ? 'text-white' : 'text-foreground')}>{event.title}</h4>
                    {event.startTime && (
                      <p className={cn('text-sm mt-1', dark ? 'text-white/70' : 'text-foreground/60')}>
                        {event.startTime}{event.endTime && ` - ${event.endTime}`}
                      </p>
                    )}
                  </button>
                );
              })}
              {dayTasks.map((task) => {
                const color = getItemColor(task, 'task');
                const dark = isDarkColor(color);
                return (
                  <button
                    key={task.id}
                    onClick={() => handleItemClick(task, 'task')}
                    className={cn(
                      'w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]',
                      task.completed ? 'bg-secondary' : `bg-pastel-${color}/90`
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={(e) => handleTaskToggle(e, task.id)}
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0',
                          task.completed
                            ? 'bg-primary border-primary'
                            : dark ? 'border-white/60 hover:bg-white/20' : 'border-foreground/40 hover:bg-foreground/10'
                        )}
                      >
                        {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className={cn(
                        'font-medium',
                        task.completed ? 'line-through text-muted-foreground' : dark ? 'text-white' : 'text-foreground'
                      )}>
                        {task.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  };

  // Get week number based on current view
  const getHeaderWeekNumber = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return getWeek(weekStart, { weekStartsOn: 1 });
    }
    if (view === 'day') {
      return getWeek(currentDate, { weekStartsOn: 1 });
    }
    return null;
  };

  const headerWeekNumber = getHeaderWeekNumber();

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flow-segment">
            {viewButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={cn('flow-segment-item', view === btn.id && 'flow-segment-item-active')}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 rounded-xl bg-secondary hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium"
            >
              Today
            </button>
            <button onClick={handleNext} className="p-2 rounded-xl bg-secondary hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Month/Year Header with Week Number */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          {headerWeekNumber && (
            <span className="text-sm font-normal text-muted-foreground/60">
              W{headerWeekNumber}
            </span>
          )}
        </div>

        {/* Calendar Content */}
        <div className="flow-card-flat">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>

        {/* Selected Date Details - Month View Only */}
        {selectedDate && view === 'month' && (
          <div className="mt-4 animate-fade-up">
            <div className="flow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-xs text-muted-foreground">
                  Close
                </button>
              </div>
              
              {(() => {
                const { events: dayEvents, tasks: dayTasks } = getItemsForDate(selectedDate);
                if (dayEvents.length === 0 && dayTasks.length === 0) {
                  return <p className="text-sm text-muted-foreground">No events or tasks</p>;
                }
                return (
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const color = getItemColor(event, 'event');
                      return (
                        <button
                          key={event.id}
                          onClick={() => handleItemClick(event, 'event')}
                          className={cn(
                            'w-full text-left p-3 rounded-xl transition-all active:scale-[0.98]',
                            `bg-pastel-${color}/90`
                          )}
                        >
                          <p className="font-medium text-foreground">{event.title}</p>
                          {event.startTime && (
                            <p className="text-xs text-foreground/60 mt-1">
                              {event.startTime}{event.endTime && ` - ${event.endTime}`}
                            </p>
                          )}
                        </button>
                      );
                    })}
                    {dayTasks.map((task) => {
                      const color = getItemColor(task, 'task');
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleItemClick(task, 'task')}
                          className={cn(
                            'w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]',
                            task.completed ? 'bg-secondary' : `bg-pastel-${color}/90`
                          )}
                        >
                          <div
                            onClick={(e) => handleTaskToggle(e, task.id)}
                            className={cn(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0',
                              task.completed
                                ? 'bg-primary border-primary'
                                : 'border-foreground/40 hover:bg-foreground/10'
                            )}
                          >
                            {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <span className={cn(
                            'font-medium',
                            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          )}>
                            {task.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
