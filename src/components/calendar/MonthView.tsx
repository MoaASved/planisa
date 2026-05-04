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
  onDayChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
  onCreateFromTimeline?: (type: 'event' | 'task' | 'note' | 'sticky', time: string) => void;
  showTimeline: boolean;
  onTimelineChange: (v: boolean) => void;
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
  onDayChange,
  onDateSelect,
  onCreateFromTimeline,
  showTimeline,
  onTimelineChange,
}: MonthViewProps) {
  const headerTouchRef = useRef<{ x: number; y: number } | null>(null);
  const bodyTouchRef = useRef<{ x: number; y: number } | null>(null);

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

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      headerTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleHeaderTouchEnd = useCallback((e: React.TouchEvent) => {
    if (headerTouchRef.current && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - headerTouchRef.current.x;
      const deltaY = e.changedTouches[0].clientY - headerTouchRef.current.y;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        onMonthChange(deltaX > 0 ? 'prev' : 'next');
      }
    }
    headerTouchRef.current = null;
  }, [onMonthChange]);

  const handleBodyTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      bodyTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleBodyTouchEnd = useCallback((e: React.TouchEvent) => {
    if (bodyTouchRef.current && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - bodyTouchRef.current.x;
      const deltaY = e.changedTouches[0].clientY - bodyTouchRef.current.y;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        onDayChange(deltaX > 0 ? 'prev' : 'next');
      }
    }
    bodyTouchRef.current = null;
  }, [onDayChange]);

  return (
    <div className="animate-fade-in flex flex-col h-full overflow-x-hidden">
      {/* Calendar grid - swipe left/right changes the whole month */}
      <div
        className="flex-shrink-0 px-3 pb-3 bg-background"
        onTouchStart={handleHeaderTouchStart}
        onTouchEnd={handleHeaderTouchEnd}
      >
        {/* Day headers */}
        <div className="grid grid-cols-[20px_repeat(7,1fr)] mb-1">
          <div className="text-center text-[9px] font-normal text-muted-foreground/30 py-1">v</div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={i} className="text-center text-[11px] font-medium text-muted-foreground/60 py-1 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="flex flex-col gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-[20px_repeat(7,1fr)] gap-0.5">
              {/* Week number */}
              <div className="flex items-center justify-center text-[9px] font-normal text-muted-foreground/25 h-11">
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
                      'h-11 flex flex-col items-center justify-center rounded-full transition-all duration-200 relative',
                      !isCurrentMonth && 'opacity-25',
                      !isTodayDate && !isSelected && 'hover:bg-secondary/40'
                    )}
                  >
                    <span className={cn(
                      'text-[15px] font-light tracking-tight w-9 h-9 rounded-full flex items-center justify-center',
                      isTodayDate && 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-medium',
                      isSelected && !isTodayDate && 'bg-[#E0E0E0] dark:bg-white/20 font-medium text-foreground',
                      !isTodayDate && !isSelected && 'text-foreground/80'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasItems && (
                      <div className="absolute bottom-1 flex gap-[3px]">
                        {dayEvents.slice(0, 1).map((event, j) => (
                          <div 
                            key={j} 
                            className={cn(
                              'w-[5px] h-[5px] rounded-full',
                              isTodayDate ? 'bg-white/70 dark:bg-[#1C1C1E]/70' : getColorDotClass(getItemColor(event, 'event'))
                            )} 
                          />
                        ))}
                        {dayTasks.filter(t => !t.completed).slice(0, 1).map((task, j) => (
                          <div 
                            key={`t-${j}`} 
                            className={cn(
                              'w-[5px] h-[5px] rounded-full',
                              isTodayDate ? 'bg-white/70 dark:bg-[#1C1C1E]/70' : getColorDotClass(getItemColor(task, 'task'))
                            )} 
                          />
                        ))}
                        {dayNotes.slice(0, 1).map((note, j) => (
                          <div 
                            key={`n-${j}`} 
                            className={cn(
                              'w-[5px] h-[5px] rounded-full',
                              isTodayDate ? 'bg-white/70 dark:bg-[#1C1C1E]/70' : getColorDotClass(getNoteColor(note))
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

      {/* Lower section - swipe left/right changes one day at a time */}
      <div
        className="flex-1 overflow-hidden flex flex-col relative bg-background"
        onTouchStart={handleBodyTouchStart}
        onTouchEnd={handleBodyTouchEnd}
      >
        <CalendarItemList
          date={selectedDate}
          events={events}
          tasks={tasks}
          notes={notes}
          getItemColor={getItemColor}
          getNoteColor={getNoteColor}
          onItemClick={onItemClick}
          onTaskToggle={onTaskToggle}
          onCreateFromTimeline={onCreateFromTimeline}
          showTimeline={showTimeline}
          onTimelineChange={onTimelineChange}
        />
      </div>
    </div>
  );
}
