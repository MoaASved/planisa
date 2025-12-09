import { 
  format, 
  startOfYear, 
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  setMonth
} from 'date-fns';
import { cn } from '@/lib/utils';

interface YearViewProps {
  currentDate: Date;
  onMonthClick: (date: Date) => void;
}

export function YearView({ currentDate, onMonthClick }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  return (
    <div className="animate-fade-in px-2">
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {months.map((month, index) => (
          <MiniMonth
            key={index}
            month={month}
            onClick={() => onMonthClick(setMonth(currentDate, index))}
          />
        ))}
      </div>
    </div>
  );
}

interface MiniMonthProps {
  month: Date;
  onClick: () => void;
}

function MiniMonth({ month, onClick }: MiniMonthProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Limit to 6 weeks max for consistent sizing
  const displayWeeks = weeks.slice(0, 6);

  return (
    <button
      onClick={onClick}
      className="group text-left p-2 md:p-3 rounded-2xl hover:bg-secondary/50 transition-all duration-200 active:scale-[0.98]"
    >
      <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {format(month, 'MMMM')}
      </h3>
      
      <div className="grid grid-cols-7 gap-px text-[8px] md:text-[9px] mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-muted-foreground/50 font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-px">
        {displayWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-px">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = isSameMonth(day, month);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'aspect-square flex items-center justify-center text-[8px] md:text-[9px] rounded-full',
                    !isCurrentMonth && 'opacity-0',
                    isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                    isCurrentMonth && !isTodayDate && 'text-foreground/70'
                  )}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </button>
  );
}
