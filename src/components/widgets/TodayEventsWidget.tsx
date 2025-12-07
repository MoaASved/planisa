import { format, isToday } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { EventColor } from '@/types';

const colorMap: Record<EventColor, string> = {
  coral: 'bg-flow-coral/15 border-l-flow-coral',
  mint: 'bg-flow-mint/15 border-l-flow-mint',
  lavender: 'bg-flow-lavender/15 border-l-flow-lavender',
  amber: 'bg-flow-amber/15 border-l-flow-amber',
  primary: 'bg-primary/15 border-l-primary',
  rose: 'bg-flow-rose/15 border-l-flow-rose',
};

export function TodayEventsWidget() {
  const { events } = useAppStore();

  const todayEvents = events
    .filter(event => isToday(event.date))
    .sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 3);

  return (
    <div className="flow-widget h-full animate-fade-up stagger-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Today's Events</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {format(new Date(), 'EEE, MMM d')}
        </span>
      </div>

      {todayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                'p-3 rounded-xl border-l-4 transition-all duration-200 hover:scale-[1.02]',
                colorMap[event.color]
              )}
            >
              <p className="font-medium text-sm text-foreground">{event.title}</p>
              <div className="flex items-center gap-3 mt-1">
                {event.startTime && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {event.startTime}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  </div>
                )}
                {event.isAllDay && (
                  <span className="text-xs text-muted-foreground">All day</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
