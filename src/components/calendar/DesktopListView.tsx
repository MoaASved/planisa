import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass, getDeepTextColor } from '@/lib/colors';
import { Check } from 'lucide-react';

interface DesktopListViewProps {
  weekDays: Date[];
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
}

const getNoteTitle = (note: Note) => {
  if (note.title && note.title !== 'Untitled') return note.title;
  if (!note.content) return '';
  return note.content
    .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .split('\n').map((l: string) => l.trim()).find((l: string) => l.length > 0) || '';
};

function getItemsForDay(
  day: Date,
  events: CalendarEvent[],
  tasks: Task[],
  notes: Note[],
) {
  const ds = format(day, 'yyyy-MM-dd');

  // Events: include if ds falls within [startDate, endDate]
  const de = events.filter(e => {
    const startDs = format(new Date(e.date), 'yyyy-MM-dd');
    const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
    return ds >= startDs && ds <= endDs;
  });
  const dt = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === ds);
  const dn = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === ds);

  // Compute time label with arrow indicators for multi-day events
  const getEventEntry = (e: CalendarEvent) => {
    if (e.isAllDay || !e.startTime) {
      return { type: 'event' as const, item: e as any, label: e.title, time: null as string | null, endTime: null as string | null };
    }
    const startDs = format(new Date(e.date), 'yyyy-MM-dd');
    const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
    if (startDs === endDs) {
      return { type: 'event' as const, item: e as any, label: e.title, time: e.startTime, endTime: e.endTime ?? null };
    }
    if (ds === startDs) {
      return { type: 'event' as const, item: e as any, label: e.title, time: `${e.startTime} →`, endTime: null as string | null };
    }
    if (ds === endDs) {
      return { type: 'event' as const, item: e as any, label: e.title, time: e.endTime ? `→ ${e.endTime}` : '→', endTime: null as string | null };
    }
    // middle day
    return { type: 'event' as const, item: e as any, label: e.title, time: '↔', endTime: null as string | null };
  };

  const deEntries = de.map(getEventEntry);

  const allDay = [
    ...deEntries.filter(e => e.time === null),
    ...dt.filter(t => !t.time).map(t => ({
      type: 'task' as const, item: t as any, label: t.title, time: null as string | null, endTime: null as string | null,
    })),
    ...dn.filter(n => !n.time).map(n => ({
      type: 'note' as const, item: n as any, label: getNoteTitle(n), time: null as string | null, endTime: null as string | null,
    })),
  ];

  const timed = [
    ...deEntries.filter(e => e.time !== null),
    ...dt.filter(t => t.time).map(t => ({
      type: 'task' as const, item: t as any, label: t.title, time: t.time!, endTime: t.endTime ?? null,
    })),
    ...dn.filter(n => n.time).map(n => ({
      type: 'note' as const, item: n as any, label: getNoteTitle(n), time: n.time!, endTime: n.endTime ?? null,
    })),
  ].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  return [...allDay, ...timed];
}

export function DesktopListView({
  weekDays, events, tasks, notes, getItemColor, getNoteColor, onItemClick, onTaskToggle,
}: DesktopListViewProps) {
  const isDayView = weekDays.length === 1;

  return (
    <div className="flex-1 overflow-y-auto">
      {weekDays.map((day, di) => {
        const items = getItemsForDay(day, events, tasks, notes);
        const todayDay = isToday(day);

        return (
          <div key={di}>
            {/* Day header — shown in week view, or as date label in day view */}
            <div className={cn(
              'flex items-center gap-3 px-6 py-3 border-b border-border/20 sticky top-0 bg-white dark:bg-[#1C1C1E] z-10',
              di > 0 && 'border-t border-border/20',
            )}>
              <span className={cn(
                'text-[11px] font-semibold uppercase tracking-widest',
                todayDay ? 'text-primary' : 'text-muted-foreground/50',
              )}>
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                'text-sm font-semibold w-7 h-7 rounded-full flex items-center justify-center',
                todayDay
                  ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]'
                  : 'text-foreground',
              )}>
                {format(day, 'd')}
              </span>
              {!isDayView && (
                <span className="text-xs text-muted-foreground/40 font-normal">
                  {format(day, 'MMMM')}
                </span>
              )}
              {isDayView && (
                <span className="text-sm text-muted-foreground/50 font-normal">
                  {format(day, 'MMMM yyyy')}
                </span>
              )}
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="px-6 py-4">
                <span className="text-sm text-muted-foreground/30">No items</span>
              </div>
            ) : (
              <div className="py-1">
                {items.map(({ type, item, label, time, endTime }, ii) => {
                  const color = type === 'note' ? getNoteColor(item as Note) : getItemColor(item, type);
                  const isTask = type === 'task';
                  const isEvent = type === 'event';
                  const completed = isTask && (item as Task).completed;
                  const deepText = getDeepTextColor(color);
                  // White/none events are nearly transparent in dark mode — use foreground so text is readable
                  const blockTextColor = (color === 'none' && document.documentElement.classList.contains('dark'))
                    ? 'hsl(var(--foreground))'
                    : deepText;

                  return (
                    <button
                      key={`${item.id}-${ii}`}
                      onClick={() => onItemClick(item, type)}
                      className="w-full flex items-center gap-4 px-6 py-2.5 hover:bg-secondary/10 transition-colors text-left group"
                    >
                      {/* Time column */}
                      <span className="w-14 flex-shrink-0 text-xs text-muted-foreground/50 font-medium tabular-nums pt-0.5">
                        {time ?? 'All day'}
                      </span>

                      {/* Item pill */}
                      <div
                        className={cn(
                          'flex-1 flex items-center gap-2 rounded-lg px-3 py-2 min-w-0',
                          getColorCardClass(color),
                        )}
                        style={{ color: blockTextColor }}
                      >
                        {isTask && (
                          <div
                            onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                            className={cn(
                              'w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center',
                              completed ? 'bg-primary border-primary' : 'border-current opacity-40',
                            )}
                          >
                            {completed && <Check className="w-2 h-2 text-white" />}
                          </div>
                        )}
                        <span className={cn(
                          'text-sm font-medium truncate',
                          completed && 'line-through opacity-50',
                        )}>
                          {label || ' '}
                        </span>
                        {(endTime || (isTask && (item as Task).subtasks.length > 0)) && (
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto pl-2">
                            {endTime && (
                              <span className="text-xs" style={{ opacity: 0.5 }}>
                                {time}–{endTime}
                              </span>
                            )}
                            {isTask && (item as Task).subtasks.length > 0 && (
                              <span className="text-xs tabular-nums" style={{ opacity: 0.5 }}>
                                {(item as Task).subtasks.filter(s => s.completed).length}/{(item as Task).subtasks.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
