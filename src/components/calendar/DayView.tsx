import { useState, useRef, useCallback } from 'react';
import { format, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { CalendarItemList } from './CalendarItemList';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onDayClick?: (date: Date) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
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
  onDayClick,
  onSwipeLeft,
  onSwipeRight,
}: DayViewProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Get week days for header
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }
    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    onDayClick?.(day);
  };

  return (
    <div 
      className="animate-fade-in flex flex-col h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Week header */}
      <div className="flex-shrink-0 border-b border-border/30">
        <div className="grid grid-cols-7 gap-px">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={i}
                onClick={() => handleDaySelect(day)}
                className={cn(
                  'py-2 text-center transition-colors rounded-lg mx-0.5',
                  isToday(day) && !isSelected && 'bg-primary/5',
                  isSelected && 'bg-primary/15'
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  'block text-lg font-semibold mt-0.5',
                  isToday(day) ? 'text-primary' : 'text-foreground',
                  isSelected && !isToday(day) && 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-hidden">
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
