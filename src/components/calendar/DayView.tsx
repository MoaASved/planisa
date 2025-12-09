import { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass } from '@/lib/colors';
import { Check, FileText } from 'lucide-react';

const HOUR_HEIGHT_BASE = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
}

export function DayView({
  currentDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onItemClick,
  onTaskToggle,
}: DayViewProps) {
  const [scale, setScale] = useState(1);
  const lastDistanceRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const getItemsForDate = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
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

  const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate();

  const allDayEvents = dayEvents.filter(e => e.isAllDay || !e.startTime);
  const allDayTasks = dayTasks.filter(t => !t.time);
  const timedEvents = dayEvents.filter(e => !e.isAllDay && e.startTime);
  const timedTasks = dayTasks.filter(t => t.time);

  const hasAllDayItems = allDayEvents.length > 0 || allDayTasks.length > 0 || dayNotes.length > 0;

  return (
    <div 
      className="animate-fade-in flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Date header */}
      <div className="flex-shrink-0 text-center py-4 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {format(currentDate, 'EEEE')}
        </span>
        <div className={cn(
          'text-4xl font-bold mt-1',
          isToday(currentDate) ? 'text-primary' : 'text-foreground'
        )}>
          {format(currentDate, 'd')}
        </div>
        <span className="text-sm text-muted-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </div>

      {/* All-day items */}
      {hasAllDayItems && (
        <div className="flex-shrink-0 border-b border-border/30 p-3 bg-secondary/20">
          <div className="text-[10px] text-muted-foreground/50 mb-2">All day</div>
          <div className="space-y-2">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onItemClick(event, 'event')}
                className={cn(
                  'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]',
                  getColorCardClass(getItemColor(event, 'event'))
                )}
              >
                <span className="font-medium text-sm">{event.title}</span>
              </div>
            ))}
            {allDayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onItemClick(task, 'task')}
                className={cn(
                  'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3',
                  task.completed ? 'bg-secondary' : getColorCardClass(getItemColor(task, 'task'))
                )}
              >
                <div
                  onClick={(e) => onTaskToggle(e, task.id)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                    task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
                  )}
                >
                  {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className={cn(
                  'font-medium text-sm',
                  task.completed && 'line-through opacity-50'
                )}>
                  {task.title}
                </span>
              </div>
            ))}
            {dayNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onItemClick(note, 'note')}
                className={cn(
                  'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3',
                  getColorCardClass(getNoteColor(note))
                )}
              >
                <FileText className="w-4 h-4 text-foreground/60 flex-shrink-0" />
                <span className="font-medium text-sm">{note.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div className="w-16 flex-shrink-0 text-xs text-muted-foreground/50 text-right pr-3 -mt-2">
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
              <div className="flex-1 border-t border-border/20" />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday(currentDate) && (
            <div
              className="absolute left-16 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: getCurrentTimePosition() }}
            >
              <div className="w-3 h-3 rounded-full bg-destructive -ml-1.5" />
              <div className="flex-1 h-[2px] bg-destructive" />
            </div>
          )}

          {/* Events column */}
          <div className="absolute left-16 right-0 top-0 bottom-0">
            {/* Timed events */}
            {timedEvents.map((event) => {
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
                    'absolute left-1 right-1 rounded-xl px-3 py-2 cursor-pointer',
                    'transition-all active:scale-[0.99]',
                    getColorCardClass(getItemColor(event, 'event'))
                  )}
                  style={{ top, height }}
                >
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  {height > hourHeight * 0.6 && (
                    <div className="text-xs text-foreground/60 mt-0.5">
                      {event.startTime}{event.endTime && ` - ${event.endTime}`}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Timed tasks */}
            {timedTasks.map((task) => {
              if (!task.time) return null;
              const top = getTimePosition(task.time);

              return (
                <div
                  key={task.id}
                  onClick={() => onItemClick(task, 'task')}
                  className={cn(
                    'absolute left-1 right-1 rounded-xl px-3 py-2 cursor-pointer',
                    'transition-all active:scale-[0.99] flex items-center gap-3',
                    task.completed ? 'bg-secondary' : getColorCardClass(getItemColor(task, 'task'))
                  )}
                  style={{ top, height: hourHeight * 0.5 }}
                >
                  <div
                    onClick={(e) => onTaskToggle(e, task.id)}
                    className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                      task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
                    )}
                  >
                    {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn(
                    'font-medium text-sm truncate',
                    task.completed && 'line-through opacity-50'
                  )}>
                    {task.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="flex-shrink-0 py-2 text-center">
        <span className="text-[10px] text-muted-foreground/40">
          Pinch to zoom • {Math.round(scale * 100)}%
        </span>
      </div>
    </div>
  );
}
