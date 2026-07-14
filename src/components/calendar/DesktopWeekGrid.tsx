import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, isToday, isSameDay, getWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass, getDeepTextColor } from '@/lib/colors';
import { Check, CalendarPlus, CheckSquare, FileText, StickyNote, Pin } from 'lucide-react';

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER_W = 52;
// Visual height of a sticky note card (12px tape + 84px card body) converted to minutes
const STICKY_VISUAL_MINS = Math.ceil((12 + 84) / HOUR_HEIGHT * 60);

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const addMins = (t: string, mins: number) => {
  const total = toMin(t) + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const getNoteTitle = (note: Note) => {
  if (note.title && note.title !== 'Untitled') return note.title;
  if (!note.content) return '';
  return note.content
    .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .split('\n').map((l: string) => l.trim()).find((l: string) => l.length > 0) || '';
};

function computeOverlap(items: { id: string; start: number; end: number }[]) {
  if (!items.length) return new Map<string, { col: number; totalCols: number }>();
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const colEnds: number[] = [];
  const colAssign: number[] = [];
  for (const item of sorted) {
    let col = colEnds.findIndex(e => e <= item.start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = item.end;
    colAssign.push(col);
  }
  const result = new Map<string, { col: number; totalCols: number }>();
  for (let i = 0; i < sorted.length; i++) {
    const { start, end } = sorted[i];
    const maxCol = sorted.reduce((mx, _, j) => {
      if (sorted[j].start < end && sorted[j].end > start) return Math.max(mx, colAssign[j]);
      return mx;
    }, 0);
    result.set(sorted[i].id, { col: colAssign[i], totalCols: maxCol + 1 });
  }
  return result;
}

// ── Slot context menu ─────────────────────────────────────────────────────────

const SLOT_ACTIONS = [
  { id: 'event' as const, label: 'Event', icon: CalendarPlus, requiresAccess: false },
  { id: 'task' as const, label: 'Task', icon: CheckSquare, requiresAccess: true },
  { id: 'note' as const, label: 'Note', icon: FileText, requiresAccess: true },
  { id: 'sticky' as const, label: 'Sticky Note', icon: StickyNote, requiresAccess: true },
];

interface SlotMenuState {
  x: number;
  y: number;
  date: Date;
  time: string;
}

function SlotContextMenu({
  x, y, time, onClose, onCreate, hasFullAccess = true,
}: {
  x: number;
  y: number;
  time: string;
  onClose: () => void;
  onCreate: (type: 'event' | 'task' | 'note' | 'sticky') => void;
  hasFullAccess?: boolean;
}) {
  const visibleActions = SLOT_ACTIONS.filter(a => hasFullAccess || !a.requiresAccess);
  const menuW = 168;
  const menuH = visibleActions.length * 46 + 40;
  const left = Math.min(x + 6, window.innerWidth - menuW - 8);
  const top = Math.max(Math.min(y - 8, window.innerHeight - menuH - 8), 8);

  return createPortal(
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-[500]" onClick={onClose} />
      <div
        className="fixed z-[501] rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        style={{
          left,
          top,
          minWidth: menuW,
          background: '#1C1C1E',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div className="px-4 py-2.5 border-b border-white/10">
          <span className="text-[11px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {time}
          </span>
        </div>
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => { onCreate(action.id); onClose(); }}
              className="flex items-center gap-3 w-full text-left transition-colors duration-100 hover:bg-white/10 active:bg-white/15"
              style={{
                padding: '11px 20px',
                borderBottom: index < visibleActions.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
              <span className="text-sm font-medium text-white">{action.label}</span>
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface DesktopWeekGridProps {
  weekDays: Date[];
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onItemClick: (item: Task | CalendarEvent | Note, type: 'task' | 'event' | 'note') => void;
  onTaskToggle: (e: React.MouseEvent, taskId: string) => void;
  onCreateFromTimeline?: (type: 'event' | 'task' | 'note' | 'sticky', time: string, date?: Date) => void;
  onDayHeaderClick?: (date: Date) => void;
  hasFullAccess?: boolean;
}

export function DesktopWeekGrid({
  weekDays, events, tasks, notes,
  selectedDate, onDateSelect,
  getItemColor, getNoteColor, onItemClick, onTaskToggle, onCreateFromTimeline, onDayHeaderClick,
  hasFullAccess = true,
}: DesktopWeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slotMenu, setSlotMenu] = useState<SlotMenuState | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ dayIndex: number; top: number } | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [expandedAllDayDay, setExpandedAllDayDay] = useState<number | null>(null);

  const getNowPos = () => {
    const n = new Date();
    return (n.getHours() * 60 + n.getMinutes()) * (HOUR_HEIGHT / 60);
  };
  const [nowPos, setNowPos] = useState(getNowPos);

  useEffect(() => {
    const tick = () => setNowPos(getNowPos());
    const ms = (60 - new Date().getSeconds()) * 1000;
    let id: ReturnType<typeof setInterval>;
    const t = setTimeout(() => { tick(); id = setInterval(tick, 60_000); }, ms);
    return () => { clearTimeout(t); clearInterval(id); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, nowPos - 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      setScrollbarWidth(scrollRef.current.offsetWidth - scrollRef.current.clientWidth);
    }
  }, []);

  // Snap pixel Y to 15-minute increments, return "HH:MM"
  const pixelToTime = (pixelY: number) => {
    const totalMinutes = Math.floor(Math.max(pixelY, 0) / HOUR_HEIGHT * 60 / 15) * 15;
    const hours = Math.min(Math.floor(totalMinutes / 60), 23);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-calendar-item]')) return;
    setHoverSlot(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const time = pixelToTime(e.clientY - rect.top);
    setSlotMenu({ x: e.clientX, y: e.clientY, date: day, time });
  };

  const handleColumnMouseMove = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if (!onCreateFromTimeline) return;
    if ((e.target as HTMLElement).closest('[data-calendar-item]')) {
      setHoverSlot(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const snappedMinutes = Math.floor(Math.max(e.clientY - rect.top, 0) / HOUR_HEIGHT * 60 / 15) * 15;
    setHoverSlot({ dayIndex, top: snappedMinutes * HOUR_HEIGHT / 60 });
  };

  // Per-day data
  const dayData = weekDays.map(day => {
    const ds = format(day, 'yyyy-MM-dd');
    // Include events whose date range covers this day
    const de = events.filter(e => {
      const startDs = format(new Date(e.date), 'yyyy-MM-dd');
      const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
      return ds >= startDs && ds <= endDs;
    });
    const dt = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === ds);
    const dn = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === ds);

    const allDay = [
      ...de.filter(e => {
        if (e.isAllDay || !e.startTime) return true;
        const startDs = format(new Date(e.date), 'yyyy-MM-dd');
        const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
        // Middle days of multi-day events appear as all-day blocks
        return ds !== startDs && ds !== endDs;
      }).map(e => ({ type: 'event' as const, item: e as any, label: e.title })),
      ...dt.filter(t => !t.time).map(t => ({ type: 'task' as const, item: t as any, label: t.title })),
      ...dn.filter(n => !n.time).map(n => ({ type: 'note' as const, item: n as any, label: getNoteTitle(n) })),
    ];

    const timed = [
      ...de.filter(e => {
        if (e.isAllDay || !e.startTime) return false;
        const startDs = format(new Date(e.date), 'yyyy-MM-dd');
        const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
        // Only start day and end day show as timed blocks
        return ds === startDs || ds === endDs;
      }).map(e => {
        const startDs = format(new Date(e.date), 'yyyy-MM-dd');
        const endDs = e.endDate ? format(new Date(e.endDate), 'yyyy-MM-dd') : startDs;
        const isStartDay = ds === startDs;
        const isMultiDay = endDs !== startDs;
        const displayLabel = isMultiDay
          ? (isStartDay ? `${e.startTime} →` : (e.endTime ? `→ ${e.endTime}` : '→'))
          : undefined;
        return {
          type: 'event' as const,
          item: e as any,
          time: isStartDay ? e.startTime! : '00:00',
          endTime: isStartDay && isMultiDay ? '23:59' : e.endTime,
          label: e.title,
          displayLabel,
        };
      }),
      ...dt.filter(t => t.time).map(t => ({
        type: 'task' as const, item: t as any, time: t.time!, endTime: t.endTime, label: t.title,
      })),
      ...dn.filter(n => n.time).map(n => ({
        type: 'note' as const, item: n as any, time: n.time!, endTime: n.endTime, label: getNoteTitle(n),
      })),
    ].sort((a, b) => a.time.localeCompare(b.time));

    const cols = computeOverlap(timed.map(i => {
      const isSticky = i.type === 'note' && (i.item as Note).type === 'sticky';
      return {
        id: i.item.id,
        start: toMin(i.time),
        end: isSticky
          ? toMin(i.time) + STICKY_VISUAL_MINS
          : toMin(i.endTime || addMins(i.time, 30)),
      };
    }));

    return { day, allDay, timed, cols };
  });

  const hasAllDay = dayData.some(d => d.allDay.length > 0);
  const isDayView = weekDays.length === 1;
  const weekNumber = !isDayView ? getWeek(weekDays[0], { weekStartsOn: 1 }) : null;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-[#1C1A18] select-none">

      {/* Day header row */}
      <div className="flex flex-shrink-0 border-b border-border/40 bg-white dark:bg-[#1C1A18]" style={{ zIndex: 10 }}>
        <div style={{ width: GUTTER_W, flexShrink: 0 }} className="flex items-end justify-center pb-2">
          {weekNumber && (
            <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wide">W{weekNumber}</span>
          )}
        </div>
        {isDayView ? (() => {
          const day = weekDays[0];
          const todayDay = isToday(day);
          return (
            <div className={cn('flex-1 border-l border-border/20 flex items-center pl-5 py-3', todayDay && 'bg-primary/[0.025]')}>
              <div>
                <span className={cn('text-[10px] font-medium uppercase tracking-widest block', todayDay ? 'text-primary' : 'text-muted-foreground/40')}>
                  {format(day, 'EEEE')}
                </span>
                <span className="text-xl font-semibold text-foreground leading-tight tracking-tight">
                  {format(day, 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          );
        })() : weekDays.map((day, i) => {
          const todayDay = isToday(day);
          const sel = isSameDay(day, selectedDate);
          return (
            <button
              key={i}
              onClick={() => onDayHeaderClick ? onDayHeaderClick(day) : onDateSelect(day)}
              className={cn(
                'flex-1 py-2 text-center border-l border-border/20 transition-colors hover:bg-secondary/20',
                sel && !todayDay && 'bg-secondary/30',
                todayDay && 'bg-primary/[0.025]',
              )}
            >
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wide block',
                todayDay ? 'text-primary' : 'text-muted-foreground/50',
              )}>
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                'text-base mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto',
                todayDay && 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-semibold',
                sel && !todayDay && 'bg-secondary font-medium text-foreground',
                !todayDay && !sel && 'font-light text-foreground/80',
              )}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
        {scrollbarWidth > 0 && <div style={{ width: scrollbarWidth, flexShrink: 0 }} />}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Single CSS grid — all-day cells and time grid cells share one column definition so widths are pixel-identical */}
        <div style={{ display: 'grid', gridTemplateColumns: `${GUTTER_W}px repeat(${weekDays.length}, minmax(0, 1fr))` }}>

          {/* All-day row: single sticky wrapper spanning all grid columns so the background and height are always uniform */}
          {hasAllDay && (
            <div
              style={{ gridColumn: '1 / -1', position: 'sticky', top: 0, zIndex: 10 }}
              className="border-b border-border/20 bg-white dark:bg-[#1C1A18]"
            >
              {/* Inner grid with same template as outer grid — column widths are computed from identical inputs so positions are pixel-identical */}
              <div style={{ display: 'grid', gridTemplateColumns: `${GUTTER_W}px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
                <div className="flex items-center justify-end pr-2">
                  <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wide text-right leading-tight">all<br />day</span>
                </div>
                {dayData.map(({ day, allDay }, i) => {
                  const isExpanded = expandedAllDayDay === i;
                  const visible = isExpanded ? allDay : allDay.slice(0, 2);
                  const overflow = allDay.length - 2;
                  return (
                    <div
                      key={i}
                      className={cn('border-l border-border/20 px-0.5 py-1 flex flex-col gap-0.5 min-h-[28px]', isToday(day) && 'bg-primary/[0.025]')}
                    >
                      {visible.map(({ type, item, label }) => {
                        const color = type === 'note' ? getNoteColor(item as Note) : getItemColor(item, type);
                        const deepText = getDeepTextColor(color);
                        const isTask = type === 'task';
                        const isNote = type === 'note';
                        const completed = isTask && (item as Task).completed;
                        const TypeIcon = isNote ? FileText : null;
                        return (
                          <div
                            key={item.id}
                            data-calendar-item="true"
                            onClick={() => onItemClick(item, type)}
                            className={cn('rounded px-1 py-0.5 cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-0.5 min-w-0', getColorCardClass(color), completed && 'opacity-60')}
                          >
                            {isTask ? (
                              <div
                                onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                                className={cn('w-2.5 h-2.5 rounded-full border flex-shrink-0 flex items-center justify-center', completed ? 'bg-primary border-primary' : 'border-current opacity-40')}
                                style={{ color: deepText }}
                              >
                                {completed && <Check className="w-1.5 h-1.5 text-white" />}
                              </div>
                            ) : TypeIcon ? (
                              <TypeIcon className="w-2.5 h-2.5 flex-shrink-0 opacity-55" style={{ color: deepText }} />
                            ) : null}
                            <span className={cn('text-[10px] font-medium truncate', completed && 'line-through')} style={{ color: deepText }}>{label}</span>
                          </div>
                        );
                      })}
                      {!isExpanded && overflow > 0 && (
                        <button
                          onClick={() => setExpandedAllDayDay(i)}
                          className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors text-left pl-0.5"
                        >
                          +{overflow} more
                        </button>
                      )}
                      {isExpanded && (
                        <button
                          onClick={() => setExpandedAllDayDay(null)}
                          className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors text-left pl-0.5"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time gutter */}
          <div className="relative" style={{ height: HOUR_HEIGHT * 24 + 32 }}>
            {HOURS.map(hour =>
              hour === 0 ? null : (
                <div
                  key={hour}
                  className="absolute right-2 text-xs text-muted-foreground/60 font-normal"
                  style={{ top: hour * HOUR_HEIGHT - 8 }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              )
            )}
          </div>

          {/* Day columns */}
          {dayData.map(({ day, timed, cols }, di) => {
            const isTodayCol = isToday(day);
            return (
              <div
                key={di}
                className={cn(
                  'relative border-l',
                  isTodayCol ? 'border-border/30 bg-primary/[0.025]' : 'border-border/20',
                  onCreateFromTimeline && 'cursor-pointer',
                )}
                style={{ height: HOUR_HEIGHT * 24 + 32 }}
                onClick={(e) => handleColumnClick(e, day)}
                onMouseMove={(e) => handleColumnMouseMove(e, di)}
                onMouseLeave={() => setHoverSlot(null)}
              >
                {/* Hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/[0.10] pointer-events-none"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={`h${hour}`}
                    className="absolute left-0 right-0 border-t border-border/[0.05] pointer-events-none"
                    style={{ top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Hover slot highlight */}
                {hoverSlot?.dayIndex === di && (
                  <div
                    className="absolute left-0 right-0 bg-primary/[0.07] pointer-events-none rounded-sm"
                    style={{ top: hoverSlot.top + 1, height: HOUR_HEIGHT / 2 - 1, zIndex: 1 }}
                  />
                )}

                {/* Now indicator */}
                {isTodayCol && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none"
                    style={{ top: nowPos, zIndex: 5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-foreground/50 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-[1.5px] bg-foreground/40" />
                  </div>
                )}

                {/* Timed items */}
                <div className="absolute inset-0 px-0.5">
                  {timed.map(({ type, item, time, endTime, label, displayLabel }) => {
                    const top = toMin(time) * HOUR_HEIGHT / 60;
                    const color = type === 'note' ? getNoteColor(item as Note) : getItemColor(item, type);
                    const isTask = type === 'task';
                    const isEvent = type === 'event';
                    const isNote = type === 'note';
                    const isSticky = isNote && (item as Note).type === 'sticky';

                    // ── Sticky note: physical card (same as mobile timeline) ──────────
                    if (isSticky) {
                      const note = item as Note;
                      let hash = 0;
                      for (let ci = 0; ci < note.id.length; ci++) hash = (hash * 31 + note.id.charCodeAt(ci)) | 0;
                      const dirSign = hash % 2 === 0 ? 1 : -1;
                      const mag = 2 + (Math.abs(hash >> 4) % 200) / 100;
                      const rotation = dirSign * mag;
                      const stickyColInfo = cols.get(item.id) || { col: 0, totalCols: 1 };
                      const stickyText = (() => {
                        if (note.content) {
                          const t = note.content
                            .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
                            .replace(/<\/li>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                          const lines = t.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
                          if (lines.length) return lines.join('\n');
                        }
                        return label || '—';
                      })();
                      return (
                        <div
                          key={item.id}
                          data-calendar-item="true"
                          className="absolute"
                          style={{
                            top: top + 2,
                            left: `calc(${(stickyColInfo.col / stickyColInfo.totalCols) * 100}% + 3px)`,
                            width: `calc(${100 / stickyColInfo.totalCols}% - 6px)`,
                            zIndex: 3,
                          }}
                        >
                          <div style={{ transform: `rotate(${rotation.toFixed(1)}deg)`, position: 'relative', paddingTop: 12 }}>
                            {/* Tape */}
                            <div className="absolute pointer-events-none" style={{ top: 2, left: '50%', transform: 'translateX(-50%)', width: 28, height: 10, background: 'rgba(255,255,255,0.52)', borderRadius: 3, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.08)' }} />
                            {/* Card */}
                            <div
                              onClick={(e) => { e.stopPropagation(); onItemClick(item, type); }}
                              className={cn('relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform', getColorCardClass(color))}
                              style={{ borderRadius: 7, boxShadow: '2px 3px 10px rgba(0,0,0,0.13)', padding: '6px 8px 16px', height: 84 }}
                            >
                              <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-white/30 to-transparent rounded-bl-lg pointer-events-none" />
                              <div className="absolute top-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-black/5 pointer-events-none" />
                              <p className="text-[10px] font-medium leading-[1.35] whitespace-pre-wrap" style={{ color: getDeepTextColor(color) }}>{stickyText}</p>
                              {time && <span className="absolute bottom-1.5 left-2 right-2 text-[9px] truncate block" style={{ color: getDeepTextColor(color), opacity: 0.5 }}>{time}{endTime && ` – ${endTime}`}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ── Regular block (event / task / note) ───────────────────────────
                    const effEnd = endTime || addMins(time, 30);
                    const durMin = Math.max(toMin(effEnd) - toMin(time), 15);
                    const height = Math.max(durMin * HOUR_HEIGHT / 60, 18);
                    const colInfo = cols.get(item.id) || { col: 0, totalCols: 1 };
                    const completed = isTask && (item as Task).completed;
                    const short = durMin < 60;
                    const deepText = getDeepTextColor(color);
                    // White/none events are nearly transparent in dark mode — use foreground so text is readable
                    const blockTextColor = (color === 'none' && document.documentElement.classList.contains('dark'))
                      ? 'hsl(var(--foreground))'
                      : deepText;
                    const TypeIcon = isEvent ? null : isNote ? FileText : null;

                    return (
                      <div
                        key={item.id}
                        data-calendar-item="true"
                        onClick={(e) => { e.stopPropagation(); onItemClick(item, type); }}
                        className={cn("absolute overflow-hidden cursor-pointer rounded-[8px] transition-opacity hover:opacity-90", getColorCardClass(color), completed && 'opacity-60')}
                        style={{
                          top: top + 2,
                          height: Math.max(height - 4, 12),
                          left: `calc(${(colInfo.col / colInfo.totalCols) * 100}% + 3px)`,
                          width: `calc(${100 / colInfo.totalCols}% - 6px)`,
                          zIndex: 2,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.09)',
                          borderLeft: undefined,
                        }}
                      >
                        {short ? (
                          <div className="flex items-center gap-0.5 px-1 h-full min-w-0">
                            {isTask ? (
                              <div
                                onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                                className={cn('w-2.5 h-2.5 rounded-full border flex-shrink-0 flex items-center justify-center', completed ? 'bg-primary border-primary' : 'border-current opacity-40')}
                              >
                                {completed && <Check className="w-1.5 h-1.5 text-white" />}
                              </div>
                            ) : TypeIcon && (
                              <TypeIcon className="w-2 h-2 flex-shrink-0 opacity-50" style={{ color: blockTextColor }} />
                            )}
                            <span className={cn('text-[10px] font-medium truncate flex-1', completed && 'line-through')} style={{ color: blockTextColor }}>{label}</span>
                            {(() => {
                              const tl = displayLabel !== undefined
                                ? displayLabel
                                : (time ? `${time}${endTime ? ` – ${endTime}` : ''}` : '');
                              return tl ? (
                                <span className="text-[9px] flex-shrink-0 ml-0.5 tabular-nums" style={{ color: blockTextColor, opacity: 0.6 }}>
                                  {tl}
                                </span>
                              ) : null;
                            })()}
                            {isTask && (item as Task).subtasks.length > 0 && (
                              <span className="text-[9px] flex-shrink-0 ml-0.5 tabular-nums" style={{ color: blockTextColor, opacity: 0.6 }}>
                                {(item as Task).subtasks.filter(s => s.completed).length}/{(item as Task).subtasks.length}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="px-1.5 py-1 h-full">
                            <div className="flex items-start gap-1">
                              {isTask ? (
                                <div
                                  onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                                  className={cn('w-3 h-3 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center', completed ? 'bg-primary border-primary' : 'border-current opacity-40')}
                                >
                                  {completed && <Check className="w-2 h-2 text-white" />}
                                </div>
                              ) : TypeIcon && (
                                <TypeIcon className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 opacity-55" style={{ color: blockTextColor }} />
                              )}
                              <div className="min-w-0">
                                <p
                                  className={cn('text-[11px] font-semibold leading-tight', completed && 'line-through', height < 48 ? 'truncate' : 'line-clamp-2')}
                                  style={{ color: blockTextColor }}
                                >{label}</p>
                                {height >= 46 && (() => {
                                  const tl = displayLabel !== undefined
                                    ? displayLabel
                                    : (time ? `${time}${endTime ? ` – ${endTime}` : ''}` : '');
                                  const hasSubtasks = isTask && (item as Task).subtasks.length > 0;
                                  if (!tl && !hasSubtasks) return null;
                                  return (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {tl && (
                                        <p className="text-[10px] leading-none truncate" style={{ color: blockTextColor, opacity: 0.55 }}>
                                          {tl}
                                        </p>
                                      )}
                                      {hasSubtasks && (
                                        <span className="text-[10px] leading-none tabular-nums flex-shrink-0" style={{ color: blockTextColor, opacity: 0.55 }}>
                                          {(item as Task).subtasks.filter(s => s.completed).length}/{(item as Task).subtasks.length}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot context menu */}
      {slotMenu && (
        <SlotContextMenu
          x={slotMenu.x}
          y={slotMenu.y}
          time={slotMenu.time}
          onClose={() => setSlotMenu(null)}
          onCreate={(type) => {
            onCreateFromTimeline?.(type, slotMenu.time, slotMenu.date);
            setSlotMenu(null);
          }}
          hasFullAccess={hasFullAccess}
        />
      )}

    </div>
  );
}
