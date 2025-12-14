import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass } from '@/lib/colors';
import { Check, FileText, Clock, Filter } from 'lucide-react';
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
  const [showTimeline, setShowTimeline] = useState(true);
  const [activeFilters, setActiveFilters] = useState<ItemType[]>(['events', 'tasks', 'notes']);

  const dateStr = format(date, 'yyyy-MM-dd');

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
  const untimedEvents = dayEvents.filter(e => e.isAllDay || !e.startTime);
  const timedEvents = dayEvents.filter(e => !e.isAllDay && e.startTime);
  const untimedTasks = dayTasks.filter(t => !t.time);
  const timedTasks = dayTasks.filter(t => t.time);

  // All untimed items (notes are always untimed in this context)
  const allUntimedItems = useMemo(() => {
    const items: { type: 'event' | 'task' | 'note'; item: CalendarEvent | Task | Note }[] = [];
    
    if (activeFilters.includes('events')) {
      untimedEvents.forEach(e => items.push({ type: 'event', item: e }));
    }
    if (activeFilters.includes('tasks')) {
      untimedTasks.forEach(t => items.push({ type: 'task', item: t }));
    }
    if (activeFilters.includes('notes')) {
      dayNotes.forEach(n => items.push({ type: 'note', item: n }));
    }
    
    return items;
  }, [untimedEvents, untimedTasks, dayNotes, activeFilters]);

  // All timed items sorted chronologically
  const allTimedItems = useMemo(() => {
    const items: { type: 'event' | 'task'; item: CalendarEvent | Task; time: string }[] = [];
    
    if (activeFilters.includes('events')) {
      timedEvents.forEach(e => items.push({ type: 'event', item: e, time: e.startTime! }));
    }
    if (activeFilters.includes('tasks')) {
      timedTasks.forEach(t => items.push({ type: 'task', item: t, time: t.time! }));
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

  const renderItemCard = useCallback((
    item: CalendarEvent | Task | Note, 
    type: 'event' | 'task' | 'note',
    showTimeStripe?: string
  ) => {
    const color = type === 'note' 
      ? getNoteColor(item as Note)
      : getItemColor(item as Task | CalendarEvent, type);

    if (type === 'task') {
      const task = item as Task;
      return (
        <div
          key={task.id}
          onClick={() => onItemClick(task, 'task')}
          className={cn(
            'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3',
            task.completed ? 'bg-secondary' : getColorCardClass(color),
            showTimeStripe && 'relative pl-5'
          )}
        >
          {showTimeStripe && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-foreground/20" />
          )}
          <div
            onClick={(e) => onTaskToggle(e, task.id)}
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
              task.completed ? 'bg-primary border-primary' : 'border-foreground/40'
            )}
          >
            {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn(
              'font-medium text-sm block truncate',
              task.completed && 'line-through opacity-50'
            )}>
              {task.title}
            </span>
            {showTimeStripe && (
              <span className="text-xs text-foreground/60">{showTimeStripe}</span>
            )}
          </div>
        </div>
      );
    }

    if (type === 'event') {
      const event = item as CalendarEvent;
      return (
        <div
          key={event.id}
          onClick={() => onItemClick(event, 'event')}
          className={cn(
            'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]',
            getColorCardClass(color),
            showTimeStripe && 'relative pl-5'
          )}
        >
          {showTimeStripe && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-foreground/20" />
          )}
          <span className="font-medium text-sm block truncate">{event.title}</span>
          {showTimeStripe && (
            <span className="text-xs text-foreground/60">
              {event.startTime}{event.endTime && ` - ${event.endTime}`}
            </span>
          )}
        </div>
      );
    }

    // Note
    const note = item as Note;
    return (
      <div
        key={note.id}
        onClick={() => onItemClick(note, 'note')}
        className={cn(
          'p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2',
          getColorCardClass(color)
        )}
      >
        <FileText className="w-4 h-4 text-foreground/60 flex-shrink-0" />
        <span className="font-medium text-sm truncate">{note.title}</span>
      </div>
    );
  }, [getItemColor, getNoteColor, onItemClick, onTaskToggle]);

  const hasItems = allUntimedItems.length > 0 || allTimedItems.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Filter toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showTimeline ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Clock className="w-5 h-5" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover">
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

        <span className="text-sm text-muted-foreground ml-2">
          {format(date, 'EEEE, MMMM d')}
        </span>
      </div>

      {!hasItems ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No items for this day
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Untimed items - 2 columns */}
          {allUntimedItems.length > 0 && (
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">No time set</div>
              <div className="grid grid-cols-2 gap-2">
                {allUntimedItems.map(({ type, item }) => (
                  <div key={item.id}>
                    {renderItemCard(item, type)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline or sorted list for timed items */}
          {allTimedItems.length > 0 && (
            <>
              {showTimeline ? (
                // Timeline view
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
                    {allTimedItems.map(({ type, item, time }) => {
                      const top = getTimePosition(time);
                      const event = type === 'event' ? item as CalendarEvent : null;
                      const endTime = event?.endTime || time;
                      const height = type === 'event' 
                        ? Math.max(getTimePosition(endTime) - top, HOUR_HEIGHT * 0.5)
                        : HOUR_HEIGHT * 0.5;

                      return (
                        <div
                          key={item.id}
                          className="absolute left-0 right-0"
                          style={{ top, height }}
                        >
                          {renderItemCard(item, type, time)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // List view - chronological
                <div className="p-4 space-y-2">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Scheduled</div>
                  {allTimedItems.map(({ type, item, time }) => (
                    <div key={item.id}>
                      {renderItemCard(item, type, time)}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
