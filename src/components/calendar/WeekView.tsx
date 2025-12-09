import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isToday,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass } from '@/lib/colors';
import { Check, FileText } from 'lucide-react';

const HOUR_HEIGHT_BASE = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onDayClick: (date: Date) => void;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function WeekView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onDayClick,
  onItemClick,
  onTaskToggle,
  onSwipeLeft,
  onSwipeRight,
}: WeekViewProps) {
  const [scale, setScale] = useState(1);
  const lastDistanceRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hourHeight = HOUR_HEIGHT_BASE * scale;

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollPosition = (now.getHours() - 1) * hourHeight;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [hourHeight]);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    } else if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const delta = distance / lastDistanceRef.current;
      const newScale = Math.min(Math.max(scale * delta, 0.5), 2.0);
      setScale(newScale);
      lastDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartRef.current.x;
      const deltaY = endY - touchStartRef.current.y;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }
    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
    const dayNotes = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    return { events: dayEvents, tasks: dayTasks, notes: dayNotes };
  };

  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) * (hourHeight / 60);
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * 60 + minutes) * (hourHeight / 60);
  };

  const getAllDayItems = (date: Date) => {
    const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate(date);
    return {
      events: dayEvents.filter(e => e.isAllDay || !e.startTime),
      tasks: dayTasks.filter(t => !t.time),
      notes: dayNotes,
    };
  };

  const getTimedItems = (date: Date) => {
    const { events: dayEvents, tasks: dayTasks } = getItemsForDate(date);
    return {
      events: dayEvents.filter(e => !e.isAllDay && e.startTime),
      tasks: dayTasks.filter(t => t.time),
    };
  };

  const hasAnyAllDayItems = weekDays.some(day => {
    const items = getAllDayItems(day);
    return items.events.length > 0 || items.tasks.length > 0 || items.notes.length > 0;
  });

  return (
    <div 
      className="animate-fade-in flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fixed header with days */}
      <div className="flex-shrink-0 border-b border-border/30">
        <div className="grid grid-cols-8 gap-px">
          <div className="w-12" /> {/* Time column spacer */}
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                'py-2 text-center transition-colors',
                isToday(day) && 'bg-primary/5',
                selectedDate && isSameDay(day, selectedDate) && 'bg-primary/10'
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase">
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                'block text-lg font-semibold mt-0.5',
                isToday(day) ? 'text-primary' : 'text-foreground'
              )}>
                {format(day, 'd')}
              </span>
            </button>
          ))}
        </div>

        {/* All-day events row */}
        {hasAnyAllDayItems && (
          <div className="grid grid-cols-8 gap-px border-t border-border/20 bg-secondary/20">
            <div className="w-12 text-[9px] text-muted-foreground/50 p-1">all-day</div>
            {weekDays.map((day, i) => {
              const allDay = getAllDayItems(day);
              return (
                <div key={i} className="p-0.5 min-h-[28px] space-y-0.5">
                  {allDay.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onItemClick(event, 'event')}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded truncate cursor-pointer',
                        getColorCardClass(getItemColor(event, 'event'))
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {allDay.tasks.slice(0, 1).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onItemClick(task, 'task')}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded truncate cursor-pointer flex items-center gap-0.5',
                        task.completed ? 'bg-secondary' : getColorCardClass(getItemColor(task, 'task'))
                      )}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-sm border flex-shrink-0',
                        task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
                      )}>
                        {task.completed && <Check className="w-2 h-2 text-primary-foreground" />}
                      </div>
                      <span className={task.completed ? 'line-through opacity-50' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {allDay.notes.slice(0, 1).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onItemClick(note, 'note')}
                      className={cn(
                        'text-[9px] px-1 py-0.5 rounded truncate cursor-pointer flex items-center gap-0.5',
                        getColorCardClass(getNoteColor(note))
                      )}
                    >
                      <FileText className="w-2 h-2 flex-shrink-0" />
                      {note.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable time grid */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="relative" style={{ height: hourHeight * 24 }}>
          {/* Time labels and grid lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex"
              style={{ top: hour * hourHeight }}
            >
              <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground/50 text-right pr-2 -mt-2">
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
              <div className="flex-1 border-t border-border/20" />
            </div>
          ))}

          {/* Current time indicator */}
          {weekDays.some(day => isToday(day)) && (
            <div
              className="absolute left-12 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: getCurrentTimePosition() }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <div className="flex-1 h-[2px] bg-destructive" />
            </div>
          )}

          {/* Day columns with events */}
          <div className="absolute left-12 right-0 top-0 bottom-0 grid grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const timed = getTimedItems(day);
              
              return (
                <div 
                  key={dayIndex} 
                  className={cn(
                    'relative border-l border-border/10',
                    isToday(day) && 'bg-primary/[0.02]'
                  )}
                >
                  {/* Timed events */}
                  {timed.events.map((event) => {
                    if (!event.startTime) return null;
                    const top = getTimePosition(event.startTime);
                    const endTime = event.endTime || event.startTime;
                    const height = Math.max(
                      getTimePosition(endTime) - top,
                      hourHeight * 0.5
                    );

                    return (
                      <div
                        key={event.id}
                        onClick={() => onItemClick(event, 'event')}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 cursor-pointer overflow-hidden',
                          'text-[10px] leading-tight',
                          getColorCardClass(getItemColor(event, 'event'))
                        )}
                        style={{ top, height }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {height > hourHeight * 0.6 && (
                          <div className="text-foreground/60 truncate">
                            {event.startTime}{event.endTime && ` - ${event.endTime}`}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Timed tasks */}
                  {timed.tasks.map((task) => {
                    if (!task.time) return null;
                    const top = getTimePosition(task.time);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onItemClick(task, 'task')}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 cursor-pointer',
                          'text-[10px] leading-tight flex items-center gap-0.5',
                          task.completed ? 'bg-secondary' : getColorCardClass(getItemColor(task, 'task'))
                        )}
                        style={{ top, height: hourHeight * 0.4 }}
                      >
                        <div
                          onClick={(e) => onTaskToggle(e, task.id)}
                          className={cn(
                            'w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center',
                            task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
                          )}
                        >
                          {task.completed && <Check className="w-2 h-2 text-primary-foreground" />}
                        </div>
                        <span className={cn(
                          'truncate',
                          task.completed && 'line-through opacity-50'
                        )}>
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
