import { useRef, useEffect, useState } from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorCardClass, getAccentVar } from '@/lib/colors';
import { Check } from 'lucide-react';

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GUTTER_W = 52;

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
}

export function DesktopWeekGrid({
  weekDays, events, tasks, notes,
  selectedDate, onDateSelect,
  getItemColor, getNoteColor, onItemClick, onTaskToggle,
}: DesktopWeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, nowPos - 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-day data
  const dayData = weekDays.map(day => {
    const ds = format(day, 'yyyy-MM-dd');
    const de = events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === ds);
    const dt = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === ds);
    const dn = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === ds);

    const allDay = [
      ...de.filter(e => e.isAllDay || !e.startTime).map(e => ({ type: 'event' as const, item: e as any, label: e.title })),
      ...dt.filter(t => !t.time).map(t => ({ type: 'task' as const, item: t as any, label: t.title })),
      ...dn.filter(n => !n.time).map(n => ({ type: 'note' as const, item: n as any, label: getNoteTitle(n) })),
    ];

    const timed = [
      ...de.filter(e => !e.isAllDay && e.startTime).map(e => ({
        type: 'event' as const, item: e as any, time: e.startTime!, endTime: e.endTime, label: e.title,
      })),
      ...dt.filter(t => t.time).map(t => ({
        type: 'task' as const, item: t as any, time: t.time!, endTime: t.endTime, label: t.title,
      })),
      ...dn.filter(n => n.time).map(n => ({
        type: 'note' as const, item: n as any, time: n.time!, endTime: n.endTime, label: getNoteTitle(n),
      })),
    ].sort((a, b) => a.time.localeCompare(b.time));

    const cols = computeOverlap(timed.map(i => ({
      id: i.item.id,
      start: toMin(i.time),
      end: toMin(i.endTime || addMins(i.time, 30)),
    })));

    return { day, allDay, timed, cols };
  });

  const hasAllDay = dayData.some(d => d.allDay.length > 0);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-[#1C1A18] select-none">

      {/* Day header row */}
      <div className="flex flex-shrink-0 border-b border-border/40 bg-white dark:bg-[#1C1A18]" style={{ zIndex: 10 }}>
        <div style={{ width: GUTTER_W, flexShrink: 0 }} />
        {weekDays.map((day, i) => {
          const todayDay = isToday(day);
          const sel = isSameDay(day, selectedDate);
          return (
            <button
              key={i}
              onClick={() => onDateSelect(day)}
              className={cn(
                'flex-1 py-2 text-center border-l border-border/20 transition-colors hover:bg-secondary/20',
                sel && !todayDay && 'bg-secondary/30',
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
      </div>

      {/* All-day / untimed row */}
      {hasAllDay && (
        <div className="flex flex-shrink-0 border-b border-border/20 bg-white dark:bg-[#1C1A18]">
          <div style={{ width: GUTTER_W, flexShrink: 0 }} className="flex items-center justify-end pr-2">
            <span className="text-[9px] text-muted-foreground/40 uppercase tracking-wide text-right leading-tight">all<br />day</span>
          </div>
          {dayData.map(({ allDay }, i) => (
            <div key={i} className="flex-1 border-l border-border/20 px-0.5 py-1 flex flex-col gap-0.5 min-h-[28px]">
              {allDay.slice(0, 2).map(({ type, item, label }) => {
                const color = type === 'note' ? getNoteColor(item as Note) : getItemColor(item, type);
                return (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item, type)}
                    className={cn('rounded px-1 py-0.5 cursor-pointer hover:opacity-90 transition-opacity', getColorCardClass(color))}
                  >
                    <span className="text-[10px] font-medium text-[#2C2C2A] block truncate">{label}</span>
                  </div>
                );
              })}
              {allDay.length > 2 && (
                <span className="text-[10px] text-muted-foreground pl-0.5">+{allDay.length - 2}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex relative" style={{ height: HOUR_HEIGHT * 24 + 32 }}>

          {/* Time gutter */}
          <div style={{ width: GUTTER_W, flexShrink: 0 }} className="relative">
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
                  'flex-1 relative border-l',
                  isTodayCol ? 'border-border/30 bg-primary/[0.025]' : 'border-border/20',
                )}
              >
                {/* Hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/[0.10]"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={`h${hour}`}
                    className="absolute left-0 right-0 border-t border-border/[0.05]"
                    style={{ top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Now indicator */}
                {isTodayCol && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none"
                    style={{ top: nowPos, zIndex: 5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-[1.5px] bg-red-500 opacity-70" />
                  </div>
                )}

                {/* Timed items */}
                <div className="absolute inset-0 px-0.5">
                  {timed.map(({ type, item, time, endTime, label }) => {
                    const top = toMin(time) * HOUR_HEIGHT / 60;
                    const effEnd = endTime || addMins(time, 30);
                    const durMin = Math.max(toMin(effEnd) - toMin(time), 15);
                    const height = Math.max(durMin * HOUR_HEIGHT / 60, 18);
                    const colInfo = cols.get(item.id) || { col: 0, totalCols: 1 };
                    const color = type === 'note' ? getNoteColor(item as Note) : getItemColor(item, type);
                    const isTask = type === 'task';
                    const isEvent = type === 'event';
                    const completed = isTask && (item as Task).completed;
                    const short = height < 30;

                    return (
                      <div
                        key={item.id}
                        onClick={() => onItemClick(item, type)}
                        className={cn(
                          'absolute overflow-hidden cursor-pointer rounded-[5px] transition-opacity hover:opacity-85',
                          getColorCardClass(color),
                        )}
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `${(colInfo.col / colInfo.totalCols) * 100}%`,
                          width: `calc(${100 / colInfo.totalCols}% - 2px)`,
                          zIndex: 2,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.09)',
                          borderLeft: isEvent ? `2.5px solid ${getAccentVar(color)}` : undefined,
                        }}
                      >
                        {short ? (
                          <div className="flex items-center gap-0.5 px-1 h-full">
                            {isTask && (
                              <div
                                onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                                className={cn('w-2.5 h-2.5 rounded-full border flex-shrink-0 flex items-center justify-center', completed ? 'bg-primary border-primary' : 'border-current opacity-40')}
                              >
                                {completed && <Check className="w-1.5 h-1.5 text-white" />}
                              </div>
                            )}
                            <span className={cn('text-[10px] font-medium text-[#2C2C2A] truncate', completed && 'line-through opacity-60')}>{label}</span>
                          </div>
                        ) : (
                          <div className="px-1.5 py-1 h-full">
                            <div className="flex items-start gap-1">
                              {isTask && (
                                <div
                                  onClick={e => { e.stopPropagation(); onTaskToggle(e, item.id); }}
                                  className={cn('w-3 h-3 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center', completed ? 'bg-primary border-primary' : 'border-current opacity-40')}
                                >
                                  {completed && <Check className="w-2 h-2 text-white" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className={cn(
                                  'text-[11px] font-semibold text-[#2C2C2A] leading-tight',
                                  completed && 'line-through opacity-60',
                                  height < 48 ? 'truncate' : 'line-clamp-2',
                                )}>{label}</p>
                                {height >= 46 && (
                                  <p className="text-[10px] text-[#2C2C2A]/55 mt-0.5 leading-none">
                                    {time}{endTime && ` – ${endTime}`}
                                  </p>
                                )}
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
    </div>
  );
}
