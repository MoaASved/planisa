import { useRef, useCallback } from 'react';
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
import { getColorDotClass, getColorCardClass, getDeepTextColor } from '@/lib/colors';
interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  /** All notes (both 'note' and 'sticky' types) regardless of showInCalendar — used for dot indicators only */
  allNotes?: Note[];
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onDayChange: (direction: 'prev' | 'next') => void;
  onDateSelect: (date: Date) => void;
  onCreateFromTimeline?: (type: 'event' | 'task' | 'note' | 'sticky', time: string) => void;
  showTimeline: boolean;
  onTimelineChange: (v: boolean) => void;
  /** Desktop only: called when a day cell is clicked, in addition to onDateSelect */
  onDesktopDayClick?: (date: Date) => void;
  /** Mobile only: called when a day cell is tapped; switches to week view for that day */
  onMobileDayTap?: (date: Date) => void;
  hasFullAccess?: boolean;
}

const getNoteLabel = (note: Note): string => {
  if (note.title && note.title !== 'Untitled') return note.title;
  if (!note.content) return '';
  return note.content
    .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .split('\n').map(l => l.trim()).find(l => l.length > 0) || '';
};

const MAX_PILLS = 3;

export function MonthView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  allNotes,
  onItemClick,
  onTaskToggle,
  onMonthChange,
  onDayChange,
  onDateSelect,
  onCreateFromTimeline,
  showTimeline,
  onTimelineChange,
  onDesktopDayClick,
  onMobileDayTap,
  hasFullAccess = true,
}: MonthViewProps) {
  const headerTouchRef = useRef<{ x: number; y: number } | null>(null);

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
    const dayEvents = events.filter(e => {
      const startStr = format(new Date(e.date), 'yyyy-MM-dd');
      const endStr = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startStr;
      return dateStr >= startStr && dateStr <= endStr;
    });
    const dayTasks = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
    // calendarNotes filtered by showInCalendar — used for the list view and desktop pills
    const dayNotes = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    // Dot-only: all regular notes (type='note') with a date on this day
    const dayRegularNotes = (allNotes ?? []).filter(n => n.type !== 'sticky' && n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    // Dot-only: all sticky notes (type='sticky') with a date on this day
    const dayStickyNotes = (allNotes ?? []).filter(n => n.type === 'sticky' && n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    return { events: dayEvents, tasks: dayTasks, notes: dayNotes, regularNotes: dayRegularNotes, stickyNotes: dayStickyNotes };
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

  return (
    <div className="animate-fade-in h-full">

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex flex-col h-full overflow-x-hidden">
        {/* Calendar grid — flex column so rows distribute evenly to fill height */}
        <div
          className="flex-1 flex flex-col px-3 pb-3 bg-background min-h-0"
          onTouchStart={handleHeaderTouchStart}
          onTouchEnd={handleHeaderTouchEnd}
        >
          {/* Day headers — fixed height */}
          <div className="flex-shrink-0 grid grid-cols-[20px_repeat(7,1fr)] mb-1">
            <div className="text-center text-[9px] font-normal text-muted-foreground/30 py-1">W</div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="text-center text-[11px] font-medium text-muted-foreground/60 py-1 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Week rows — flex-1 so each row gets equal height filling the remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex-1 grid grid-cols-[20px_repeat(7,1fr)] border-b border-foreground/[0.08] last:border-b-0">
                {/* Week number — top-aligned to match date numbers */}
                <div className="flex items-start justify-center pt-2 text-[9px] font-normal text-muted-foreground/25">
                  {getWeek(week[0], { weekStartsOn: 1 })}
                </div>

                {week.map((day, dayIndex) => {
                  const { events: dayEvents, tasks: dayTasks, notes: dayNotes, regularNotes: dayRegularNotes, stickyNotes: dayStickyNotes } = getItemsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  // Merge all item types into one list for stacked bars.
                  // Use dayNotes (showInCalendar-filtered) — same source as the week detail view —
                  // not dayRegularNotes/dayStickyNotes which come from allNotes and include
                  // notes the detail view never shows.
                  const allDayItems = [
                    ...dayEvents.map(e => getItemColor(e, 'event')),
                    ...dayTasks.filter(t => !t.completed).map(t => getItemColor(t, 'task')),
                    ...dayNotes.map(n => getNoteColor(n)),
                  ];
                  const maxBars = allDayItems.length > 3 ? 2 : 3;

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => onMobileDayTap ? onMobileDayTap(day) : onDateSelect(day)}
                      className={cn(
                        'w-full flex flex-col overflow-hidden transition-all duration-200 pt-1.5',
                        !isCurrentMonth && 'opacity-25',
                        !isTodayDate && !isSelected && 'hover:bg-secondary/40'
                      )}
                    >
                      {/* Date number — always at top, horizontally centred */}
                      <span className={cn(
                        'text-[21px] font-normal tracking-tight w-10 h-10 rounded-full flex items-center justify-center mx-auto flex-shrink-0',
                        isTodayDate && 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-medium',
                        isSelected && !isTodayDate && 'bg-[#E0E0E0] dark:bg-muted font-medium text-foreground dark:text-foreground',
                        !isTodayDate && !isSelected && 'text-foreground/80'
                      )}>
                        {format(day, 'd')}
                      </span>
                      {/* Stacked full-width bars, max 3; overflow becomes "+X" label */}
                      {allDayItems.length > 0 && (
                        <div className="mt-1 flex flex-col gap-[2px] px-1">
                          {allDayItems.slice(0, maxBars).map((color, i) => (
                            <div
                              key={i}
                              className={cn(
                                'w-full h-1 rounded-full flex-shrink-0',
                                isTodayDate ? 'bg-white/70 dark:bg-[#1C1C1E]/70' : getColorDotClass(color)
                              )}
                            />
                          ))}
                          {allDayItems.length > 3 && (
                            <span className="text-[9px] font-medium text-muted-foreground/60 leading-none pl-0.5 flex-shrink-0">
                              +{allDayItems.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Desktop full-height month grid ── */}
      <div className="hidden md:flex flex-col h-full min-h-0 bg-white dark:bg-[#1C1A18] select-none">

        {/* Day-of-week header */}
        <div className="grid grid-cols-[32px_repeat(7,1fr)] flex-shrink-0 border-b border-border/40">
          {/* Week-number gutter placeholder */}
          <div className="border-r border-border/20" />
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-medium text-muted-foreground/50 py-2 uppercase tracking-wide border-r border-border/20 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows — each row fills equal height */}
        <div className="flex-1 flex flex-col min-h-0">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="flex-1 flex min-h-0 border-b border-border/20 last:border-b-0"
            >
              {/* Week number */}
              <div className="w-8 flex-shrink-0 flex items-start justify-center pt-2 border-r border-border/20">
                <span className="text-[10px] font-normal text-muted-foreground/30 leading-none">
                  {getWeek(week[0], { weekStartsOn: 1 })}
                </span>
              </div>
              {week.map((day, dayIndex) => {
                const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                const allItems = [
                  ...dayEvents.map(e => ({ label: e.title, color: getItemColor(e, 'event') })),
                  ...dayTasks.filter(t => !t.completed).map(t => ({ label: t.title, color: getItemColor(t, 'task') })),
                  ...dayNotes.map(n => ({ label: getNoteLabel(n), color: getNoteColor(n) })),
                ];
                const visibleItems = allItems.slice(0, MAX_PILLS);
                const overflowCount = allItems.length - MAX_PILLS;

                return (
                  <div
                    key={dayIndex}
                    onClick={() => { onDateSelect(day); onDesktopDayClick?.(day); }}
                    className={cn(
                      'flex-1 flex flex-col p-1.5 cursor-pointer border-r border-border/20 last:border-r-0 transition-colors hover:bg-secondary/10 overflow-hidden',
                      !isCurrentMonth && 'opacity-35',
                    )}
                  >
                    {/* Day number */}
                    <div className="flex-shrink-0 mb-1">
                      <span className={cn(
                        'text-[13px] w-7 h-7 rounded-full flex items-center justify-center',
                        isTodayDate
                          ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-semibold'
                          : isSelected
                          ? 'bg-secondary font-medium text-foreground'
                          : 'font-light text-foreground/80',
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Event/task/note pills */}
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {visibleItems.map(({ label, color }, i) => (
                        <div
                          key={i}
                          className={cn('rounded px-1.5 py-[2px] flex-shrink-0', getColorCardClass(color))}
                        >
                          <span className="text-[10px] font-medium block truncate leading-tight" style={{ color: getDeepTextColor(color) }}>
                            {label || ' '}
                          </span>
                        </div>
                      ))}
                      {overflowCount > 0 && (
                        <span className="text-[10px] text-muted-foreground/60 px-1 flex-shrink-0">
                          +{overflowCount} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
