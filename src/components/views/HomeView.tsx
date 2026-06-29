import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { tasks, events, settings } = useAppStore();
  const today = new Date();
  const todayTasks = tasks.filter(t => t.date && isToday(new Date(t.date)) && !t.hidden);
  const todayEvents = events.filter(e => isToday(new Date(e.date)));

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const userName = settings.name?.trim();

  // Merge events + tasks and sort by start time
  const hhmm = (t?: string) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const todayItems = [
    ...todayEvents.map(e => ({
      id: `e-${e.id}`,
      title: e.title,
      time: e.isAllDay ? undefined : e.startTime,
      color: (e.color || 'peony') as string,
      completed: false,
      sortKey: e.isAllDay ? -1 : (hhmm(e.startTime) ?? 10000),
    })),
    ...todayTasks.map(t => ({
      id: `t-${t.id}`,
      title: t.title,
      time: t.time,
      color: t.color as string,
      completed: t.completed,
      sortKey: hhmm(t.time) ?? 10000,
    })),
  ].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
      <div className="px-4 py-4">

        {/* Greeting */}
        <div className="mb-8 pt-2">
          <h1 className="text-[34px] font-bold tracking-tight leading-tight">
            {userName ? `Hi TEST, ${userName} 👋🏽` : 'Hi TEST 👋🏽'}
          </h1>
          <p className="text-[15px] text-muted-foreground/70 mt-1.5">
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 gap-3">

          {/* This Week widget — unchanged */}
          <button
            onClick={() => onNavigate('calendar')}
            className="flow-widget text-left w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="flow-section-title">This Week</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex gap-1">
              {weekDays.map((day, i) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
                const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day) && !t.hidden);
                const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 p-2 rounded-xl text-center transition-all',
                      isToday(day) && 'bg-primary text-primary-foreground',
                      !isToday(day) && 'bg-secondary'
                    )}
                  >
                    <span className="text-xs font-medium block">{format(day, 'EEE')}</span>
                    <span className="text-lg font-semibold">{format(day, 'd')}</span>
                    {hasItems && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {dayEvents.slice(0, 2).map((e, j) => (
                          <div key={j} className={cn('w-1.5 h-1.5 rounded-full', isToday(day) ? 'bg-primary-foreground/60' : `bg-pastel-${e.color}`)} />
                        ))}
                        {dayTasks.slice(0, 2 - dayEvents.slice(0, 2).length).map((t, j) => (
                          <div key={`t-${j}`} className={cn('w-1.5 h-1.5 rounded-full', isToday(day) ? 'bg-primary-foreground/60' : `bg-pastel-${t.color}`)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </button>

          {/* Today — unified events + tasks, sorted by time */}
          <div className="flow-widget">
            <button
              onClick={() => onNavigate('calendar')}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="flow-section-title">Today</h3>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            {todayItems.length > 0 ? (
              <div className="divide-y divide-border/30">
                {todayItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', `bg-pastel-${item.color}`)} />
                    <span className={cn(
                      'flex-1 text-[15px] leading-snug truncate',
                      item.completed && 'line-through text-muted-foreground/50'
                    )}>
                      {item.title}
                    </span>
                    {item.time && (
                      <span className="text-[13px] text-muted-foreground/50 flex-shrink-0 tabular-nums">
                        {item.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] text-muted-foreground/60">You've got a clear day ☁️</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
