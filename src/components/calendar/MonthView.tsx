import { useState, useRef, useCallback } from 'react';
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
  getWeek
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorDotClass } from '@/lib/colors';
import { CalendarItemList } from './CalendarItemList';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onItemClick,
  onTaskToggle,
  onMonthChange,
  onDateSelect,
}: MonthViewProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Generate calendar grid
  const monthStart = startOfMonth(currentDate);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
        if (deltaX > 0) {
          onMonthChange('prev');
        } else {
          onMonthChange('next');
        }
      }
    }
    touchStartRef.current = null;
  }, [onMonthChange]);

  return (
    <div 
      className="animate-fade-in flex flex-col h-full overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar grid */}
      <div className="flex-shrink-0 px-2">
        {/* Day headers */}
        <div className="grid grid-cols-[24px_repeat(7,1fr)] mb-1">
          <div className="text-center text-[9px] font-normal text-muted-foreground/40 py-1">v</div>
          {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex flex-col gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-[24px_repeat(7,1fr)] gap-0.5">
              {/* Week number - narrower column */}
              <div className="flex items-center justify-center text-[9px] font-normal text-muted-foreground/30 h-10">
                {getWeek(week[0], { weekStartsOn: 1 })}
              </div>
              
              {week.map((day, dayIndex) => {
                const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate(day);
                const hasItems = dayEvents.length > 0 || dayTasks.length > 0 || dayNotes.length > 0;
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={dayIndex}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      'h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-200 relative',
                      !isCurrentMonth && 'opacity-30',
                      isTodayDate && 'bg-primary text-primary-foreground',
                      isSelected && !isTodayDate && 'bg-primary/15 ring-1 ring-primary/50',
                      !isTodayDate && !isSelected && 'hover:bg-secondary/60'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isTodayDate ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasItems && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 1).map((event, j) => (
                          <div 
                            key={j} 
                            className={cn(
                              'w-1 h-1 rounded-full',
                              isTodayDate ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(event, 'event'))
                            )} 
                          />
                        ))}
                        {dayTasks.filter(t => !t.completed).slice(0, 1).map((task, j) => (
                          <div 
                            key={`t-${j}`} 
                            className={cn(
                              'w-1 h-1 rounded-full',
                              isTodayDate ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(task, 'task'))
                            )} 
                          />
                        ))}
                        {dayNotes.slice(0, 1).map((note, j) => (
                          <div 
                            key={`n-${j}`} 
                            className={cn(
                              'w-1 h-1 rounded-full',
                              isTodayDate ? 'bg-primary-foreground/70' : getColorDotClass(getNoteColor(note))
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

      {/* Items list */}
      <div className="flex-1 overflow-hidden border-t border-border/30 mt-2">
        <CalendarItemList
          date={selectedDate}
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
