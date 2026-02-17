import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass, getColorVar } from '@/lib/colors';
import { Check, FileText, Clock, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Helper function: add minutes to a time string
const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

type ItemType = 'events' | 'tasks' | 'notes';

type TimedItem = { type: 'event' | 'task' | 'note'; item: CalendarEvent | Task | Note; time: string; endTime?: string };

// Calculate overlap columns for timeline items (Apple Calendar style)
const getOverlapColumns = (items: TimedItem[]): Map<string, { column: number; totalColumns: number }> => {
  const columns: Map<string, { column: number; totalColumns: number }> = new Map();
  
  if (items.length === 0) return columns;
  
  // Sort by start time
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  
  // Find overlapping groups using a more accurate algorithm
  const groups: TimedItem[][] = [];
  
  sorted.forEach((item) => {
    const itemStart = item.time;
    const itemEnd = item.endTime || addMinutes(item.time, 30);
    
    // Find if this item overlaps with any existing group
    let addedToGroup = false;
    
    for (const group of groups) {
      // Check if item overlaps with any item in the group
      const overlapsWithGroup = group.some(existing => {
        const existingStart = existing.time;
        const existingEnd = existing.endTime || addMinutes(existing.time, 30);
        return itemStart < existingEnd && itemEnd > existingStart;
      });
      
      if (overlapsWithGroup) {
        group.push(item);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groups.push([item]);
    }
  });
  
  // Assign columns within each group
  groups.forEach(group => {
    // Sort group by start time for consistent column assignment
    group.sort((a, b) => a.time.localeCompare(b.time));
    group.forEach((item, index) => {
      columns.set(item.item.id, { 
        column: index, 
        totalColumns: group.length 
      });
    });
  });
  
  return columns;
};

// Scroll container with bottom fade effect
function ListScrollContainer({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [children, checkScroll]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="h-full overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-2"
      >
        {children}
      </div>
      {canScrollDown && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '70px',
            background: 'linear-gradient(to bottom, transparent, hsl(30 20% 98%))',
          }}
        />
      )}
    </div>
  );
}

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
  const untimedNotes = dayNotes.filter(n => !n.time);
  const timedNotes = dayNotes.filter(n => n.time);

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
      dayNotes.forEach(n => items.push({ type: 'note', item: n, time: n.time, endTime: n.endTime }));
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
      untimedNotes.forEach(n => items.push({ type: 'note', item: n }));
    }
    
    return items;
  }, [allDayEvents, untimedTasks, untimedNotes, activeFilters]);

  // Timed items for timeline view
  const timedItems = useMemo(() => {
    const items: { type: 'event' | 'task' | 'note'; item: CalendarEvent | Task | Note; time: string; endTime?: string }[] = [];
    
    if (activeFilters.includes('events')) {
      timedEvents.forEach(e => items.push({ type: 'event', item: e, time: e.startTime!, endTime: e.endTime }));
    }
    if (activeFilters.includes('tasks')) {
      timedTasks.forEach(t => items.push({ type: 'task', item: t, time: t.time!, endTime: t.endTime }));
    }
    if (activeFilters.includes('notes')) {
      timedNotes.forEach(n => items.push({ type: 'note', item: n, time: n.time!, endTime: n.endTime }));
    }
    
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [timedEvents, timedTasks, timedNotes, activeFilters]);

  // Calculate overlap columns for timeline view
  const overlapColumns = useMemo(() => getOverlapColumns(timedItems), [timedItems]);

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
    compact?: boolean,
    fillHeight?: boolean
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
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          className={cn(
            'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] flex items-start gap-3 relative',
            task.completed ? 'bg-secondary' : getColorCardClass(color),
            compact ? 'p-2.5 pt-2.5' : 'p-3.5 pt-3.5',
            fillHeight && 'h-full',
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
            <div className="flex items-center justify-between gap-1">
              <span className={cn(
                'font-medium truncate',
                compact ? 'text-xs' : 'text-sm',
                task.completed && 'line-through opacity-50'
              )}>
                {task.title}
              </span>
              {task.subtasks.length > 0 && (
                <span className={cn('text-muted-foreground flex-shrink-0', compact ? 'text-[10px]' : 'text-xs')}>
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
              )}
            </div>
            {showTime && time && (
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
        <div
          draggable
          onDragStart={() => handleDragStart(event.id, 'event')}
          onDragEnd={handleDragEnd}
          onClick={() => onItemClick(event, 'event')}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          className={cn(
            'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden',
            getColorCardClass(color),
            compact ? 'p-2.5' : 'p-3.5',
            showTimelineIndicator && 'pl-4',
            fillHeight && 'h-full',
            isDragging && 'opacity-50 scale-95'
          )}
        >
          {/* Gradient stripe for timed events */}
          {showTimelineIndicator && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[12px]"
              style={{
                background: `linear-gradient(to bottom, ${getColorVar(color)}, transparent)`
              }}
            />
          )}
          <span className={cn('font-semibold block truncate', compact ? 'text-xs' : 'text-sm')}>
            {event.title}
          </span>
          {showTime && time && (
            <span className="text-xs text-foreground/45 font-light mt-0.5 block">
              {time}{endTime && ` - ${endTime}`}
            </span>
          )}
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
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          className={cn(
          'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] flex items-start gap-2',
          getColorCardClass(color),
          compact ? 'p-2.5 pt-2.5' : 'p-3.5 pt-3.5',
          fillHeight && 'h-full',
          isDragging && 'opacity-50 scale-95'
        )}
      >
        <FileText className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-foreground/60 flex-shrink-0 mt-0.5')} />
        <div className="flex-1 min-w-0">
          <span className={cn('font-medium block truncate', compact ? 'text-xs' : 'text-sm')}>{note.title || 'Untitled'}</span>
          {showTime && time && (
            <span className="text-xs text-foreground/60">
              {time}{endTime && ` - ${endTime}`}
            </span>
          )}
        </div>
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
        <span className="text-base font-semibold text-foreground/80">
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
            <div className="px-4 pt-2 pb-4 border-b border-border/20 mb-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
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
            {/* Hour lines - subtle thin lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full flex"
                style={{ top: hour * HOUR_HEIGHT }}
              >
                <div className="w-12 flex-shrink-0 text-[10px] text-muted-foreground/35 text-right pr-3 -mt-2 font-light">
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
                <div className="flex-1 border-t border-foreground/[0.06]" />
              </div>
            ))}

            {/* Timed items with column layout for overlaps */}
            <div className="absolute left-16 right-4 top-0 bottom-0">
              {timedItems.map(({ type, item, time, endTime }) => {
                const top = getTimePosition(time);
                // Default to 30 minutes if no end time specified
                const calculatedEndTime = endTime || addMinutes(time, 30);
                const height = Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5);

                // Get column info for overlapping items
                const colInfo = overlapColumns.get(item.id) || { column: 0, totalColumns: 1 };
                const widthPercent = 100 / colInfo.totalColumns;
                const leftPercent = colInfo.column * widthPercent;

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{ 
                      top, 
                      height,
                      left: `${leftPercent}%`,
                      width: `calc(${widthPercent}% - ${colInfo.totalColumns > 1 ? '4px' : '0px'})`,
                    }}
                  >
                    {renderItemCard(item, type, time, endTime, true, true)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // List view - all items with time shown on cards
        <ListScrollContainer>
          {allItems.map(({ type, item, time, endTime }) => (
            <div key={item.id}>
              {renderItemCard(item, type, time, endTime)}
            </div>
          ))}
        </ListScrollContainer>
      )}
    </div>
  );
}
