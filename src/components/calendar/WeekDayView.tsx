import { useState, useRef, useCallback, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday, isSameDay, getWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { CalendarItemList } from './CalendarItemList';

interface WeekDayViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
}

export function WeekDayView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onItemClick,
  onTaskToggle,
  onWeekChange,
  onDateSelect,
}: WeekDayViewProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Get week days for header
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

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
      {/* Week header - clean white background */}
      <div className="flex-shrink-0 px-3 pb-3 bg-background">
        <div className="grid grid-cols-[20px_repeat(7,1fr)] gap-1">
          {/* Week number */}
          <div className="flex items-center justify-center text-[9px] font-normal text-muted-foreground/25 py-2">
            v{weekNumber}
          </div>
          
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={cn(
                  'py-2 text-center transition-all rounded-2xl',
                  !isSelected && 'hover:bg-secondary/40'
                )}
              >
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase block tracking-wide">
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  'text-lg mt-0.5 w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all',
                  isTodayDate && 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-medium',
                  isSelected && !isTodayDate && 'bg-[#E0E0E0] dark:bg-white/20 font-medium text-foreground',
                  !isTodayDate && !isSelected && 'font-light text-foreground/80'
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lower section - unified background, no divider */}
      <div className="flex-1 flex flex-col relative bg-background">
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
