import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass } from '@/lib/colors';
import { Check, FileText, Clock, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type ItemType = 'events' | 'tasks' | 'notes';

interface CalendarItemListProps {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
}

export function CalendarItemList({
  date,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onItemClick,
  onTaskToggle,
}: CalendarItemListProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ItemType[]>(['events', 'tasks', 'notes']);
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'task' | 'event' | 'note' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const dateStr = format(date, 'yyyy-MM-dd');

  // Auto-scroll to 7:00 when timeline is activated
  useEffect(() => {
    if (showTimeline && timelineRef.current) {
      const scrollPosition = 7 * HOUR_HEIGHT;
      timelineRef.current.scrollTop = scrollPosition;
    }
  }, [showTimeline]);

  // Filter items for this date
  const dayEvents = useMemo(() => 
    events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr),
    [events, dateStr]
  );
  
  const dayTasks = useMemo(() => 
    tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr),
    [tasks, dateStr]
  );
  
  const dayNotes = useMemo(() => 
    notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr),
    [notes, dateStr]
  );

  // Separate timed and untimed items
  const allDayEvents = dayEvents.filter(e => e.isAllDay || !e.startTime);
  const timedEvents = dayEvents.filter(e => !e.isAllDay && e.startTime);
  const untimedTasks = dayTasks.filter(t => !t.time);
  const timedTasks = dayTasks.filter(t => t.time);

  // All items for non-timeline view (shows everything)
  const allItems = useMemo(() => {
    const items: { type: 'event' | 'task' | 'note'; item: CalendarEvent | Task | Note; time?: string; endTime?: string }[] = [];
    
    if (activeFilters.includes('events')) {
      dayEvents.forEach(e => {
        const time = e.isAllDay ? undefined : e.startTime;
        items.push({ type: 'event', item: e, time, endTime: e.endTime });
      });
    }
    if (activeFilters.includes('tasks')) {
      dayTasks.forEach(t => items.push({ type: 'task', item: t, time: t.time, endTime: t.endTime }));
    }
    if (activeFilters.includes('notes')) {
      dayNotes.forEach(n => items.push({ type: 'note', item: n }));
    }
    
    // Sort: untimed first, then by time
    return items.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return -1;
      if (!b.time) return 1;
      return a.time.localeCompare(b.time);
    });
  }, [dayEvents, dayTasks, dayNotes, activeFilters]);

  // All-day items for timeline view (2-column at top)
  const allDayItems = useMemo(() => {
    const items: { type: 'event' | 'task' | 'note'; item: CalendarEvent | Task | Note }[] = [];
    
    if (activeFilters.includes('events')) {
      allDayEvents.forEach(e => items.push({ type: 'event', item: e }));
    }
    if (activeFilters.includes('tasks')) {
      untimedTasks.forEach(t => items.push({ type: 'task', item: t }));
    }
    if (activeFilters.includes('notes')) {
      dayNotes.forEach(n => items.push({ type: 'note', item: n }));
    }
    
    return items;
  }, [allDayEvents, untimedTasks, dayNotes, activeFilters]);

  // Timed items for timeline view
  const timedItems = useMemo(() => {
    const items: { type: 'event' | 'task'; item: CalendarEvent | Task; time: string; endTime?: string }[] = [];
    
    if (activeFilters.includes('events')) {
      timedEvents.forEach(e => items.push({ type: 'event', item: e, time: e.startTime!, endTime: e.endTime }));
    }
    if (activeFilters.includes('tasks')) {
      timedTasks.forEach(t => items.push({ type: 'task', item: t, time: t.time!, endTime: t.endTime }));
    }
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [timedEvents, timedTasks, activeFilters]);

  const toggleFilter = (filter: ItemType) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) * (HOUR_HEIGHT / 60);
  };

  const getFilterLabel = () => {
    if (activeFilters.length === 3) return 'All';
    if (activeFilters.length === 0) return 'None';
    return activeFilters.map(f => f.charAt(0).toUpperCase() + f.slice(1, -1)).join(', ');
  };

  // Drag handlers
  const handleDragStart = (itemId: string, type: 'task' | 'event' | 'note') => {
    setDraggedItem({ id: itemId, type });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Check if item has both start AND end time (for timeline indicator)
  const hasTimeRange = (item: CalendarEvent | Task, type: 'event' | 'task'): boolean => {
    if (type === 'event') {
      const event = item as CalendarEvent;
      return !!(event.startTime && event.endTime);
    }
    if (type === 'task') {
      const task = item as Task;
      return !!(task.time && task.endTime);
    }
    return false;
  };

  const renderItemCard = useCallback((
    item: CalendarEvent | Task | Note, 
    type: 'event' | 'task' | 'note',
    time?: string,
    endTime?: string,
    compact?: boolean
  ) => {
    const color = type === 'note' 
      ? getNoteColor(item as Note)
      : getItemColor(item as Task | CalendarEvent, type);

    const showTime = time && !showTimeline;
    const showTimelineIndicator = type !== 'note' && hasTimeRange(item as CalendarEvent | Task, type);
    const isDragging = draggedItem?.id === item.id;

    if (type === 'task') {
      const task = item as Task;
      return (
        <div
          draggable
          onDragStart={() => handleDragStart(task.id, 'task')}
          onDragEnd={handleDragEnd}
          onClick={() => onItemClick(task, 'task')}
          className={cn(
            'rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 relative',
            task.completed ? 'bg-secondary' : getColorCardClass(color),
            compact ? 'p-2' : 'p-3',
            isDragging && 'opacity-50 scale-95'
          )}
        >
          <div
            onClick={(e) => onTaskToggle(e, task.id)}
            className={cn(
              'rounded-full border-2 flex items-center justify-center flex-shrink-0',
              compact ? 'w-4 h-4' : 'w-5 h-5',
              task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
            )}
          >
            {task.completed && <Check className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-primary-foreground')} />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn(
              'font-medium block truncate',
              compact ? 'text-xs' : 'text-sm',
              task.completed && 'line-through opacity-50'
            )}>
              {task.title}
            </span>
          {showTime && (
              <span className="text-xs text-foreground/60">
                {time}{endTime && ` - ${endTime}`}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (type === 'event') {
      const event = item as CalendarEvent;
      return (
        <div className="flex items-stretch gap-1.5">
          {/* Timeline indicator - only for items with start AND end time */}
          {showTimelineIndicator && !showTimeline && (
            <div className="w-1 rounded-full bg-foreground/70 flex-shrink-0" />
          )}
          <div
            draggable
            onDragStart={() => handleDragStart(event.id, 'event')}
            onDragEnd={handleDragEnd}
            onClick={() => onItemClick(event, 'event')}
            className={cn(
              'flex-1 rounded-xl cursor-pointer transition-all active:scale-[0.98] relative',
              getColorCardClass(color),
              compact ? 'p-2' : 'p-3',
              isDragging && 'opacity-50 scale-95'
            )}
          >
            <span className={cn('font-medium block truncate', compact ? 'text-xs' : 'text-sm')}>
              {event.title}
            </span>
            {showTime && (
              <span className="text-xs text-foreground/60">
                {time}{endTime && ` - ${endTime}`}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Note
    const note = item as Note;
    return (
      <div
        draggable
        onDragStart={() => handleDragStart(note.id, 'note')}
        onDragEnd={handleDragEnd}
        onClick={() => onItemClick(note, 'note')}
        className={cn(
          'rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2',
          getColorCardClass(color),
          compact ? 'p-2' : 'p-3',
          isDragging && 'opacity-50 scale-95'
        )}
      >
        <FileText className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-foreground/60 flex-shrink-0')} />
        <span className={cn('font-medium truncate', compact ? 'text-xs' : 'text-sm')}>{note.title || 'Untitled'}</span>
      </div>
    );
  }, [getItemColor, getNoteColor, onItemClick, onTaskToggle, showTimeline, draggedItem]);

  const hasItems = showTimeline 
    ? (allDayItems.length > 0 || timedItems.length > 0)
    : allItems.length > 0;

  // Format date for display (e.g., "January 16")
  const formattedDate = format(date, 'MMMM d');

  return (
    <div className="flex flex-col h-full">
      {/* Filter toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Date display on left */}
        <span className="text-base font-semibold text-foreground">
          {formattedDate}
        </span>

        {/* Clock icon + All filter on right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showTimeline ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            <Clock className="w-5 h-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors text-sm font-medium">
                {getFilterLabel()}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover min-w-[140px]">
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('events')}
                onCheckedChange={() => toggleFilter('events')}
              >
                Events
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('tasks')}
                onCheckedChange={() => toggleFilter('tasks')}
              >
                Tasks
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilters.includes('notes')}
                onCheckedChange={() => toggleFilter('notes')}
              >
                Notes
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!hasItems ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No items for this day
        </div>
      ) : showTimeline ? (
        // Timeline view - only timed items + all-day at top
        <div ref={timelineRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* All-day items - 2 columns */}
          {allDayItems.length > 0 && (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {allDayItems.map(({ type, item }) => (
                  <div key={item.id}>
                    {renderItemCard(item, type, undefined, undefined, true)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="relative px-4 pb-4" style={{ height: HOUR_HEIGHT * 24 }}>
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full flex"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground/50 text-right pr-2 -mt-2">
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
                <div className="flex-1 border-t border-border/20" />
              </div>
            ))}

            {/* Timed items */}
            <div className="absolute left-16 right-4 top-0 bottom-0">
            {timedItems.map(({ type, item, time, endTime }) => {
                const top = getTimePosition(time);
                const calculatedEndTime = endTime || time;
                const height = (type === 'event' || (type === 'task' && endTime))
                  ? Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5)
                  : HOUR_HEIGHT * 0.5;

                return (
                  <div
                    key={item.id}
                    className="absolute left-0 right-0"
                    style={{ top, height }}
                  >
                    {renderItemCard(item, type, undefined, undefined, true)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // List view - all items with time shown on cards
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-2">
          {allItems.map(({ type, item, time, endTime }) => (
            <div key={item.id}>
              {renderItemCard(item, type, time, endTime)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
