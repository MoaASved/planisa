import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass, getColorVar, getAccentVar } from '@/lib/colors';
import { Check, FileText, Clock, List, ChevronDown, CalendarPlus, CheckSquare, StickyNote, Pin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Sticky note card: 14px tape padding + 110px card = 124px visual height on the timeline
const STICKY_VISUAL_MINUTES = Math.ceil((14 + 110) / HOUR_HEIGHT * 60); // 124 min at 60px/hr
const STICKY_RESERVE_PX = 124; // 120px card width + 4px breathing gap

const getNoteDisplayTitle = (note: Note): string => {
  if (note.title && note.title !== 'Untitled') return note.title;
  if (!note.content) return '';
  const text = note.content
    .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return text.split('\n').map(l => l.trim()).find(l => l.length > 0) || '';
};

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
  const result: Map<string, { column: number; totalColumns: number }> = new Map();
  if (items.length === 0) return result;

  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const sorted = [...items]
    .map(item => ({
      item,
      start: toMin(item.time),
      end: toMin(item.endTime || addMinutes(item.time, 30)),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // Greedy column assignment: reuse the earliest column whose last item has already ended.
  // Two items only share a column when they do NOT overlap (one ends at or before the other starts).
  const columnEnds: number[] = [];
  const assignments: { id: string; column: number; start: number; end: number }[] = [];

  for (const { item, start, end } of sorted) {
    let col = columnEnds.findIndex(e => e <= start);
    if (col === -1) col = columnEnds.length; // all columns busy — open a new one
    columnEnds[col] = end;
    assignments.push({ id: item.item.id, column: col, start, end });
  }

  // totalColumns for each item = highest column index among all items concurrent with it, plus 1.
  // Items that are not concurrent get totalColumns = 1 (full width).
  for (const a of assignments) {
    const concurrent = assignments.filter(b => b.start < a.end && b.end > a.start);
    const totalColumns = Math.max(...concurrent.map(b => b.column)) + 1;
    result.set(a.id, { column: a.column, totalColumns });
  }

  return result;
};

// Scroll container with top + bottom fade effect
function ListScrollContainer({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
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
        className="h-full overflow-y-auto overflow-x-hidden px-5 pb-6 space-y-2"
      >
        {children}
      </div>
      {canScrollUp && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '70px',
            background: 'linear-gradient(to top, transparent, #ffffff)',
          }}
        />
      )}
      {canScrollDown && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '70px',
            background: 'linear-gradient(to bottom, transparent, #ffffff)',
          }}
        />
      )}
    </div>
  );
}

type CreateType = 'event' | 'task' | 'note' | 'sticky';

interface TimeContextMenu {
  x: number;
  y: number;
  time: string;
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
  onCreateFromTimeline?: (type: CreateType, time: string) => void;
  showTimeline: boolean;
  onTimelineChange: (v: boolean) => void;
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
  onCreateFromTimeline,
  showTimeline,
  onTimelineChange,
}: CalendarItemListProps) {
  const [activeFilters, setActiveFilters] = useState<ItemType[]>(['events', 'tasks', 'notes']);
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'task' | 'event' | 'note' } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timedItemsRef = useRef<{ time: string }[]>([]);
  const [timelineCanScrollUp, setTimelineCanScrollUp] = useState(false);
  const [timelineCanScrollDown, setTimelineCanScrollDown] = useState(false);
  const [contextMenu, setContextMenu] = useState<TimeContextMenu | null>(null);
  const [allDayExpanded, setAllDayExpanded] = useState(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastListTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const isTodayDate = isToday(date);

  const getNowPosition = () => {
    const now = new Date();
    return (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60);
  };
  const [nowPosition, setNowPosition] = useState(getNowPosition);

  useEffect(() => {
    if (!isTodayDate) return;
    const tick = () => setNowPosition(getNowPosition());
    const ms = (60 - new Date().getSeconds()) * 1000;
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => { tick(); intervalId = setInterval(tick, 60_000); }, ms);
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
  }, [isTodayDate]);

  const checkTimelineScroll = useCallback(() => {
    const el = timelineRef.current;
    if (!el) return;
    setTimelineCanScrollUp(el.scrollTop > 4);
    setTimelineCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  // Auto-scroll to current time (or earliest event) when timeline is activated
  useEffect(() => {
    if (!showTimeline || !timelineRef.current) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let targetMinutes = currentMinutes - 60;
    const items = timedItemsRef.current;
    if (items.length > 0) {
      const earliest = Math.min(...items.map(i => {
        const [h, m] = i.time.split(':').map(Number);
        return h * 60 + m;
      }));
      if (earliest < currentMinutes) targetMinutes = Math.min(targetMinutes, earliest - 30);
    }
    timelineRef.current.scrollTop = Math.max(0, targetMinutes * (HOUR_HEIGHT / 60));
    checkTimelineScroll();
  }, [showTimeline, checkTimelineScroll]);

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
  timedItemsRef.current = timedItems;

  // Calculate overlap columns for timeline view — exclude sticky notes, they have their own fixed right-side layout
  const overlapColumns = useMemo(() =>
    getOverlapColumns(timedItems.filter(i => !(i.type === 'note' && (i.item as Note).type === 'sticky'))),
    [timedItems]
  );

  // Visual time ranges occupied by sticky notes (card height converted to minutes, not item duration)
  const stickyRanges = useMemo(() =>
    timedItems
      .filter(i => i.type === 'note' && (i.item as Note).type === 'sticky')
      .map(i => {
        const [h, m] = i.time.split(':').map(Number);
        const startMin = h * 60 + m;
        return { startMin, endMin: startMin + STICKY_VISUAL_MINUTES };
      }),
    [timedItems]
  );

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

  // Double-tap/double-click on timeline background to create items
  const getTimeFromY = (clientY: number): string => {
    const el = timelineRef.current;
    if (!el) return '09:00';
    const timelineInner = el.querySelector('[data-timeline-grid]') as HTMLElement | null;
    const gridTop = timelineInner ? timelineInner.getBoundingClientRect().top : el.getBoundingClientRect().top;
    const y = clientY - gridTop;
    const totalMinutes = Math.max(0, Math.round((y / HOUR_HEIGHT) * 60 / 15) * 15);
    const hour = Math.min(Math.floor(totalMinutes / 60), 23);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const showMenuAt = (clientX: number, clientY: number, time?: string) => {
    const resolvedTime = time !== undefined ? time : getTimeFromY(clientY);
    const menuW = 160;
    const menuH = 176;
    // Measure the actual bottom nav bar to get a reliable safe zone
    const nav = document.querySelector('nav');
    const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight - 120;
    const safeBottom = window.innerHeight - navTop + 8;
    const x = Math.min(clientX, window.innerWidth - menuW - 8);
    const y = Math.min(clientY - 20, window.innerHeight - menuH - safeBottom);
    setContextMenu({ x: Math.max(8, x), y: Math.max(8, y), time: resolvedTime });
  };

  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-timeline-item]')) return;
    e.preventDefault();
    showMenuAt(e.clientX, e.clientY);
  };

  // Touch double-tap (within 300ms, within 30px)
  const handleTimelineTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-timeline-item]')) return;
    const touch = e.changedTouches[0];
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.time < 300 && Math.abs(touch.clientX - last.x) < 30 && Math.abs(touch.clientY - last.y) < 30) {
      e.preventDefault();
      showMenuAt(touch.clientX, touch.clientY);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };

  const handleListDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-list-item]')) return;
    e.preventDefault();
    showMenuAt(e.clientX, e.clientY, '');
  };

  const handleListTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-list-item]')) return;
    const touch = e.changedTouches[0];
    const now = Date.now();
    const last = lastListTapRef.current;
    if (last && now - last.time < 300 && Math.abs(touch.clientX - last.x) < 30 && Math.abs(touch.clientY - last.y) < 30) {
      e.preventDefault();
      showMenuAt(touch.clientX, touch.clientY, '');
      lastListTapRef.current = null;
    } else {
      lastListTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };

  const handleContextMenuSelect = (type: CreateType) => {
    if (contextMenu) {
      onCreateFromTimeline?.(type, contextMenu.time);
    }
    setContextMenu(null);
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
    fillHeight?: boolean,
    centerContent?: boolean
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
            'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] flex gap-3 relative text-[#2C2C2A]',
            centerContent ? 'items-center px-2.5' : 'items-start',
            !centerContent && (compact ? 'p-2.5 pt-2.5' : 'p-3.5 pt-3.5'),
            getColorCardClass(color),
            task.completed && 'opacity-60',
            fillHeight && 'h-full',
            isDragging && 'opacity-50 scale-95'
          )}
        >
          <div
            onClick={(e) => onTaskToggle(e, task.id)}
            className={cn(
              'rounded-full border-2 flex items-center justify-center flex-shrink-0',
              compact ? 'w-4 h-4' : 'w-5 h-5',
              task.completed ? 'bg-primary border-primary' : ''
            )}
            style={!task.completed ? { borderColor: getAccentVar(color) } : undefined}
          >
            {task.completed && <Check className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-primary-foreground')} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className={cn(
                'font-medium truncate',
                compact ? 'text-xs' : 'text-sm',
                task.completed && 'line-through'
              )}>
                {task.title}
              </span>
              {task.subtasks.length > 0 && (
                <span className={cn('text-[#2C2C2A]/60 flex-shrink-0', compact ? 'text-[10px]' : 'text-xs')}>
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
              )}
            </div>
            {showTime && time && (
              <span className="text-xs text-[#2C2C2A]/70">
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
            'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden text-[#2C2C2A]',
            getColorCardClass(color),
            compact ? 'p-2.5 pl-3' : 'p-3.5 pl-4',
            fillHeight && 'h-full',
            isDragging && 'opacity-50 scale-95'
          )}
        >
          {/* Solid colored left border — always present on events */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[12px] pointer-events-none"
            style={{ background: getAccentVar(color) }}
          />
          <span className={cn('font-semibold block truncate', compact ? 'text-xs' : 'text-sm')}>
            {event.title}
          </span>
          {showTime && time && (
            <span className="text-xs text-[#2C2C2A]/60 font-light mt-0.5 block">
              {time}{endTime && ` - ${endTime}`}
            </span>
          )}
        </div>
      );
    }

    // Note
    const note = item as Note;
    const isSticky = note.type === 'sticky';
    // Only apply physical sticky styling outside of list view (i.e. in timeline/compact contexts)
    const stickyStyled = isSticky && (showTimeline || compact);

    // In timeline mode sticky notes still display their time (they don't span a duration)
    const noteShowTime = showTime || (isSticky && showTimeline && !!time);

    // Deterministic slight rotation — timeline/compact only, never list view
    const stickyRotation = stickyStyled ? (() => {
      let hash = 0;
      for (let i = 0; i < note.id.length; i++) {
        hash = (hash * 31 + note.id.charCodeAt(i)) | 0;
      }
      return (((hash % 300) + 300) % 300) / 100 - 1.5;
    })() : 0;

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(note.id, 'note')}
        onDragEnd={handleDragEnd}
        onClick={() => onItemClick(note, 'note')}
        style={{
          boxShadow: stickyStyled ? '2px 3px 10px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.08)',
          transform: stickyStyled ? `rotate(${stickyRotation.toFixed(2)}deg)` : undefined,
        }}
        className={cn(
          'rounded-[12px] cursor-pointer transition-all active:scale-[0.98] flex items-start gap-2 text-[#2C2C2A]',
          stickyStyled && 'relative overflow-hidden',
          getColorCardClass(color),
          compact ? 'p-2.5 pt-2.5' : 'p-3.5 pt-3.5',
          fillHeight && 'h-full',
          isDragging && 'opacity-50 scale-95'
        )}
      >
        {/* Folded corner — only in timeline/compact, not list view */}
        {stickyStyled && (
          <>
            <div className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-white/30 to-transparent rounded-bl-lg pointer-events-none" />
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-black/5 pointer-events-none" />
          </>
        )}
        {isSticky
          ? <Pin className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5', 'text-[#2C2C2A]/45 flex-shrink-0 mt-0.5')} />
          : <FileText className={cn(compact ? 'w-3 h-3' : 'w-4 h-4', 'text-[#2C2C2A]/70 flex-shrink-0 mt-0.5')} />
        }
        <div className="flex-1 min-w-0">
          <span className={cn('font-medium block truncate', compact ? 'text-xs' : 'text-sm')}>{getNoteDisplayTitle(note as Note)}</span>
          {noteShowTime && time && (
            <span className="text-xs text-[#2C2C2A]/70">
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
    <div className="flex flex-col min-h-full bg-background pt-4">
      {/* White card lifts from the beige background */}
      <div
        className="flex flex-col flex-grow"
        style={{
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
      {/* Filter toolbar */}
      <div className="flex items-center justify-between px-5 py-4">
        {/* Date display on left */}
        <span className="flow-section-title">
          {formattedDate}
        </span>

        {/* Clock icon + All filter on right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTimelineChange(!showTimeline)}
            className="p-2 rounded-lg transition-colors hover:bg-secondary"
          >
            {showTimeline
              ? <Clock className="w-5 h-5 text-muted-foreground" />
              : <List className="w-5 h-5 text-foreground" />
            }
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

      {showTimeline ? (
        // Timeline view — always render the full 24h grid regardless of content
        <div className="flex-1 relative overflow-hidden">
          {/* Floating all-day badge — outside scroll area, top-right */}
          {allDayItems.length > 0 && (
            <button
              onClick={() => setAllDayExpanded(v => !v)}
              className="absolute top-2 right-3 z-20 flex items-center gap-0.5 h-7 px-2 rounded-full transition-all active:scale-95"
              style={{
                background: '#1C1C1E',
                boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
              }}
            >
              <span className="text-[12px] font-semibold text-white tabular-nums leading-none">{allDayItems.length}</span>
              <ChevronDown
                className={cn('w-3 h-3 text-white/80 transition-transform duration-200', allDayExpanded && 'rotate-180')}
              />
            </button>
          )}
          <div
            ref={timelineRef}
            onScroll={checkTimelineScroll}
            onDoubleClick={handleTimelineDoubleClick}
            onTouchEnd={handleTimelineTouchEnd}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden select-none"
          >
            {/* All-day expanded grid — sticky at top, only when open */}
            {allDayItems.length > 0 && allDayExpanded && (
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="px-4 pb-3 pt-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                    {allDayItems.map(({ type, item }) => (
                      <div key={item.id}>
                        {renderItemCard(item, type, undefined, undefined, true)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div data-timeline-grid className="relative px-4 pb-4" style={{ height: HOUR_HEIGHT * 24 }}>
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

              {/* Current time indicator — today only */}
              {isTodayDate && (
                <div
                  className="absolute w-full flex items-center pointer-events-none"
                  style={{ top: nowPosition, zIndex: 10 }}
                >
                  <div className="w-12 flex-shrink-0 flex justify-end pr-[9px]">
                    <div className="w-[5px] h-[5px] rounded-full bg-foreground/40 dark:bg-foreground/50" />
                  </div>
                  <div className="flex-1 h-px bg-foreground/20 dark:bg-foreground/25" />
                </div>
              )}

              {/* Timed items with column layout for overlaps */}
              <div className="absolute left-16 right-4 top-0 bottom-0">
                {timedItems.map(({ type, item, time, endTime }) => {
                  const top = getTimePosition(time);
                  const GAP = 4;

                  // Sticky notes: physical sticky note appearance, fixed size on right side
                  if (type === 'note' && (item as Note).type === 'sticky') {
                    const note = item as Note;
                    const stickyIsDragging = draggedItem?.id === note.id;
                    const colorClass = getColorCardClass(getNoteColor(note));

                    // Deterministic rotation 2–4 deg, direction based on id hash
                    let hash = 0;
                    for (let i = 0; i < note.id.length; i++) {
                      hash = (hash * 31 + note.id.charCodeAt(i)) | 0;
                    }
                    const dirSign = hash % 2 === 0 ? 1 : -1;
                    const mag = 2 + (Math.abs(hash >> 4) % 200) / 100;
                    const rotation = dirSign * mag;

                    return (
                      <div
                        key={item.id}
                        data-timeline-item
                        className="absolute"
                        style={{ top: top + GAP, right: 0, width: 120, zIndex: 2 }}
                      >
                        {/* Outer rotates tape + card together */}
                        <div style={{ transform: `rotate(${rotation.toFixed(1)}deg)`, position: 'relative', paddingTop: 14 }}>
                          {/* Tape strip centered above the card */}
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              top: 2,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 36,
                              height: 12,
                              background: 'rgba(255,255,255,0.52)',
                              borderRadius: 3,
                              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.08)',
                            }}
                          />
                          {/* Card */}
                          <div
                            draggable
                            onDragStart={() => handleDragStart(note.id, 'note')}
                            onDragEnd={handleDragEnd}
                            onClick={() => onItemClick(note, 'note')}
                            className={cn(
                              'relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform',
                              colorClass,
                              stickyIsDragging && 'opacity-50'
                            )}
                            style={{
                              borderRadius: 8,
                              boxShadow: '3px 4px 12px rgba(0,0,0,0.15)',
                              padding: '8px 10px 22px',
                              height: 110,
                            }}
                          >
                            {/* Folded corner */}
                            <div className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-br from-white/30 to-transparent rounded-bl-lg pointer-events-none" />
                            <div className="absolute top-0 right-0 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-black/5 pointer-events-none" />
                            {/* Title — up to 3 lines */}
                            <p className="text-xs font-medium text-[#2C2C2A] line-clamp-3 leading-[1.35]">
                              {getNoteDisplayTitle(note) || '—'}
                            </p>
                            {/* Time — pinned to bottom */}
                            {time && (
                              <span className="absolute bottom-2 left-2.5 right-2.5 text-[10px] text-[#2C2C2A]/50 truncate block">
                                {time}{endTime && ` – ${endTime}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Default to 30 minutes if no end time specified
                  const calculatedEndTime = endTime || addMinutes(time, 30);
                  const height = Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5);

                  // Get column info for overlapping items
                  const colInfo = overlapColumns.get(item.id) || { column: 0, totalColumns: 1 };
                  const widthPercent = 100 / colInfo.totalColumns;
                  const leftPercent = colInfo.column * widthPercent;

                  // Shrink block to the left of any overlapping sticky note
                  const [bsh, bsm] = time.split(':').map(Number);
                  const blockStartMin = bsh * 60 + bsm;
                  const [beh, bem] = calculatedEndTime.split(':').map(Number);
                  const blockEndMin = beh * 60 + bem;
                  const nearSticky = stickyRanges.some(
                    s => s.startMin < blockEndMin && s.endMin > blockStartMin
                  );
                  const gapPx = colInfo.totalColumns > 1 ? 4 : 0;
                  const blockLeft = nearSticky
                    ? `calc(${leftPercent}% - ${(leftPercent * STICKY_RESERVE_PX / 100).toFixed(1)}px)`
                    : `${leftPercent}%`;
                  const blockWidth = nearSticky
                    ? `calc(${widthPercent}% - ${(widthPercent * STICKY_RESERVE_PX / 100).toFixed(1)}px - ${gapPx}px)`
                    : `calc(${widthPercent}% - ${gapPx}px)`;

                  const shortBlock = type === 'task' && height <= HOUR_HEIGHT * 0.5;
                  return (
                    <div
                      key={item.id}
                      data-timeline-item
                      className="absolute"
                      style={{
                        top: top + GAP / 2,
                        height: Math.max(height - GAP, 20),
                        left: blockLeft,
                        width: blockWidth,
                      }}
                    >
                      {renderItemCard(item, type, time, endTime, true, true, shortBlock)}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Spacer so the last time slot scrolls above the bottom nav bar */}
            <div className="h-24" />
          </div>
          {timelineCanScrollUp && (
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: '70px',
                background: 'linear-gradient(to top, transparent, #ffffff)',
              }}
            />
          )}
          {timelineCanScrollDown && (
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: '70px',
                background: 'linear-gradient(to bottom, transparent, #ffffff)',
              }}
            />
          )}
        </div>
      ) : (
        // List view - all items with time shown on cards; double-tap on empty area to create
        <div
          className="flex-1 flex flex-col"
          onDoubleClick={handleListDoubleClick}
          onTouchEnd={handleListTouchEnd}
        >
          {hasItems && (
            <ListScrollContainer>
              {allItems.map(({ type, item, time, endTime }) => (
                <div key={item.id} data-list-item>
                  {renderItemCard(item, type, time, endTime)}
                </div>
              ))}
            </ListScrollContainer>
          )}
        </div>
      )}
      </div>

      {/* Long-press context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[1300]"
            onPointerDown={() => setContextMenu(null)}
          />
          <div
            className="fixed z-[1400] bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y, width: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
          >
            {contextMenu.time && (
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{contextMenu.time}</span>
              </div>
            )}
            {(
              [
                { type: 'event' as CreateType, label: 'Event', icon: CalendarPlus },
                { type: 'task' as CreateType, label: 'Task', icon: CheckSquare },
                { type: 'note' as CreateType, label: 'Note', icon: FileText },
                { type: 'sticky' as CreateType, label: 'Sticky', icon: StickyNote },
              ] as const
            ).map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleContextMenuSelect(type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 active:bg-secondary transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-foreground/60 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </button>
            ))}
            <div className="h-1.5" />
          </div>
        </>
      )}
    </div>
  );
}
