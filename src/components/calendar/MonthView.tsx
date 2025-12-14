import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getWeek,
  addMonths,
  subMonths
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorDotClass } from '@/lib/colors';
import { CalendarItemList } from './CalendarItemList';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onDayClick: (date: Date) => void;
  onDateChange: (date: Date) => void;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
}

function CompactMonthGrid({
  monthDate,
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onDayClick,
  opacity = 1,
}: {
  monthDate: Date;
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onDayClick: (date: Date) => void;
  opacity?: number;
}) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
    const dayNotes = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    return { events: dayEvents, tasks: dayTasks, notes: dayNotes };
  };

  return (
    <div 
      className="transition-opacity duration-300"
      style={{ opacity }}
    >
      {/* Month header */}
      <div className="text-center py-2">
        <span className="text-sm font-semibold text-foreground">
          {format(monthDate, 'MMMM yyyy')}
        </span>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-8 mb-1">
        <div className="text-center text-[10px] font-normal text-muted-foreground/40 py-1">W</div>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid - compact */}
      <div className="flex flex-col">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-8">
            {/* Week number */}
            <div className="flex items-center justify-center text-[9px] font-normal text-muted-foreground/30 h-8">
              {getWeek(week[0], { weekStartsOn: 1 })}
            </div>
            
            {week.map((day, dayIndex) => {
              const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate(day);
              const hasItems = dayEvents.length > 0 || dayTasks.length > 0 || dayNotes.length > 0;
              const isCurrentMonth = isSameMonth(day, monthDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dayIndex}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'h-8 flex flex-col items-center justify-center rounded-lg transition-all duration-200 relative',
                    !isCurrentMonth && 'opacity-30',
                    isToday(day) && 'bg-primary text-primary-foreground',
                    isSelected && !isToday(day) && 'bg-primary/15 ring-1 ring-primary/50',
                    !isToday(day) && !isSelected && 'hover:bg-secondary/60'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isToday(day) ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasItems && (
                    <div className="absolute bottom-0.5 flex gap-0.5">
                      {dayEvents.slice(0, 1).map((event, j) => (
                        <div 
                          key={j} 
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(event, 'event'))
                          )} 
                        />
                      ))}
                      {dayTasks.filter(t => !t.completed).slice(0, 1).map((task, j) => (
                        <div 
                          key={`t-${j}`} 
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(task, 'task'))
                          )} 
                        />
                      ))}
                      {dayNotes.slice(0, 1).map((note, j) => (
                        <div 
                          key={`n-${j}`} 
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getNoteColor(note))
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onDayClick,
  onDateChange,
  onItemClick,
  onTaskToggle,
}: MonthViewProps) {
  const [localSelectedDate, setLocalSelectedDate] = useState<Date>(selectedDate || new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate 3 months: previous, current, next
  const months = [
    subMonths(currentDate, 1),
    currentDate,
    addMonths(currentDate, 1),
  ];

  // Scroll to center (current month) on mount and when currentDate changes
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const monthHeight = container.scrollHeight / 3;
      container.scrollTop = monthHeight;
    }
  }, [currentDate]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrolling) return;

    const container = scrollRef.current;
    const monthHeight = container.scrollHeight / 3;
    const scrollTop = container.scrollTop;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce the month change
    scrollTimeoutRef.current = setTimeout(() => {
      // If scrolled past top threshold, go to previous month
      if (scrollTop < monthHeight * 0.3) {
        setIsScrolling(true);
        onDateChange(subMonths(currentDate, 1));
        setTimeout(() => setIsScrolling(false), 100);
      }
      // If scrolled past bottom threshold, go to next month
      else if (scrollTop > monthHeight * 1.7) {
        setIsScrolling(true);
        onDateChange(addMonths(currentDate, 1));
        setTimeout(() => setIsScrolling(false), 100);
      }
    }, 150);
  }, [currentDate, onDateChange, isScrolling]);

  const handleDayClick = (date: Date) => {
    setLocalSelectedDate(date);
    onDayClick(date);
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Compact calendar grid section */}
      <div className="flex-shrink-0 relative overflow-hidden" style={{ height: '280px' }}>
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable months container */}
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden scroll-smooth px-4"
          onScroll={handleScroll}
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {months.map((month, index) => {
            const isCurrent = index === 1;
            return (
              <div 
                key={format(month, 'yyyy-MM')}
                className="min-h-full"
                style={{ scrollSnapAlign: 'start' }}
              >
                <CompactMonthGrid
                  monthDate={month}
                  currentDate={currentDate}
                  selectedDate={localSelectedDate}
                  events={events}
                  tasks={tasks}
                  notes={notes}
                  getItemColor={getItemColor}
                  getNoteColor={getNoteColor}
                  onDayClick={handleDayClick}
                  opacity={isCurrent ? 1 : 0.4}
                />
              </div>
            );
          })}
        </div>
        
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      </div>

      {/* Items list section */}
      <div className="flex-1 border-t border-border/30 overflow-hidden">
        <CalendarItemList
          date={localSelectedDate}
          events={events}
          tasks={tasks}
          notes={notes}
          getItemColor={getItemColor}
          getNoteColor={getNoteColor}
          onItemClick={onItemClick}
          onTaskToggle={onTaskToggle}
        />
      </div>
    </div>
  );
}
