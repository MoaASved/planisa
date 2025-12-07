import { format, isToday, isTomorrow, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function MiniCalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { events, tasks } = useAppStore();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(e.date, 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(t.date, 'yyyy-MM-dd') === dateStr);
    return [...dayEvents, ...dayTasks];
  };

  return (
    <div className="flow-widget h-full animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Calendar</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground min-w-[100px] text-center">
            {format(currentDate, 'MMM yyyy')}
          </span>
          <button 
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {weekDays.map((day, i) => {
          const items = getItemsForDate(day);
          const hasItems = items.length > 0;
          
          return (
            <button
              key={i}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200',
                isToday(day) 
                  ? 'bg-primary text-primary-foreground shadow-card' 
                  : 'hover:bg-secondary',
                hasItems && !isToday(day) && 'bg-primary/5'
              )}
            >
              <span className={cn(
                'text-sm font-medium',
                !isToday(day) && 'text-foreground'
              )}>
                {format(day, 'd')}
              </span>
              {hasItems && (
                <div className="flex gap-0.5 mt-0.5">
                  {items.slice(0, 3).map((_, j) => (
                    <div 
                      key={j} 
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isToday(day) ? 'bg-primary-foreground/70' : 'bg-primary'
                      )} 
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
