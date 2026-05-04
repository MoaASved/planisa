import { useRef, useCallback } from 'react';
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
  onDayChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
  onCreateFromTimeline?: (type: 'event' | 'task' | 'note' | 'sticky', time: string) => void;
  showTimeline: boolean;
  onTimelineChange: (v: boolean) => void;
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
  onDayChange,
  onDateSelect,
  onCreateFromTimeline,
  showTimeline,
  onTimelineChange,
}: WeekDayViewProps) {
  const headerTouchRef = useRef<{ x: number; y: number } | null>(null);
  const bodyTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Get week days for header
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });

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
        onWeekChange(deltaX > 0 ? 'prev' : 'next');
      }
    }
    headerTouchRef.current = null;
  }, [onWeekChange]);

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
      {/* Week header - swipe left/right changes the whole week */}
      <div
        className="flex-shrink-0 px-3 pb-3 bg-background"
        onTouchStart={handleHeaderTouchStart}
        onTouchEnd={handleHeaderTouchEnd}
      >
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
