import { useState, useRef, useCallback, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { CalendarItemList } from './CalendarItemList';

interface WeekDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

export function WeekDayView({
  currentDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onItemClick,
  onTaskToggle,
  onWeekChange,
}: WeekDayViewProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Get week days for header
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Update selected date when currentDate changes (week navigation)
  useEffect(() => {
    // Find the same day of week in new week, or default to first day
    const currentDayOfWeek = selectedDate.getDay();
    const newSelectedDay = weekDays.find(d => d.getDay() === currentDayOfWeek) || weekDays[0];
    if (!weekDays.some(d => isSameDay(d, selectedDate))) {
      setSelectedDate(newSelectedDay);
    }
  }, [currentDate]);

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
          onWeekChange('prev');
        } else {
          onWeekChange('next');
        }
      }
    }
    touchStartRef.current = null;
  }, [onWeekChange]);

  return (
    <div 
      className="animate-fade-in flex flex-col h-full overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Week header */}
      <div className="flex-shrink-0 px-2 pb-2">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'py-2 text-center transition-all rounded-xl',
                  isSelected && 'bg-primary/15',
                  !isSelected && 'hover:bg-secondary/60'
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase block">
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  'text-lg font-semibold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto',
                  isTodayDate && 'bg-primary text-primary-foreground',
                  !isTodayDate && 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-hidden border-t border-border/30">
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