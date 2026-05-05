import { useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getYear,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface YearViewProps {
  currentDate: Date;
  onMonthClick: (date: Date) => void;
}

const YEARS_BEFORE = 5;
const YEARS_AFTER = 6;

export function YearView({ currentDate, onMonthClick }: YearViewProps) {
  const today = new Date();
  const activeYear = getYear(currentDate);
  const years = Array.from(
    { length: YEARS_BEFORE + YEARS_AFTER + 1 },
    (_, i) => activeYear - YEARS_BEFORE + i
  );

  // Scroll to the active year instantly on mount
  useEffect(() => {
    document
      .getElementById(`ycal-${activeYear}`)
      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  return (
    <div className="animate-fade-in h-full overflow-y-auto pb-24">
      {years.map(year => (
        <div key={year} id={`ycal-${year}`} className="px-4 mb-2">
          <p className={cn(
            'text-xl font-semibold tracking-tight py-3',
            year === getYear(today) ? 'text-foreground' : 'text-muted-foreground/40'
          )}>
            {year}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, m) => {
              const monthDate = new Date(year, m, 1);
              return (
                <MiniMonth
                  key={m}
                  month={monthDate}
                  isSelected={isSameMonth(monthDate, currentDate)}
                  isTodayMonth={isSameMonth(monthDate, today)}
                  onClick={() => onMonthClick(monthDate)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MiniMonthProps {
  month: Date;
  isSelected: boolean;
  isTodayMonth: boolean;
  onClick: () => void;
}

function MiniMonth({ month, isSelected, isTodayMonth, onClick }: MiniMonthProps) {
  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left px-2 pt-2 pb-2.5 rounded-2xl transition-all duration-150 active:scale-[0.97]',
        isSelected ? 'bg-[#1C1C1E] dark:bg-white' : 'hover:bg-secondary/50'
      )}
    >
      {/* Month name */}
      <p className={cn(
        'text-[11px] font-semibold mb-1.5',
        isSelected
          ? 'text-white dark:text-[#1C1C1E]'
          : isTodayMonth
          ? 'text-foreground font-bold'
          : 'text-foreground/80'
      )}>
        {format(month, 'MMM')}
      </p>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px mb-0.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className={cn(
            'text-center text-[6.5px] font-medium',
            isSelected ? 'text-white/40 dark:text-[#1C1C1E]/40' : 'text-muted-foreground/35'
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.slice(0, 6).map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-px">
          {week.map((day, di) => {
            const inMonth = isSameMonth(day, month);
            const isT = isToday(day);
            return (
              <div
                key={di}
                className={cn(
                  'aspect-square flex items-center justify-center text-[7px] rounded-full',
                  !inMonth && 'opacity-0',
                  isT && !isSelected && 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] font-bold',
                  isT && isSelected && 'bg-white/30 dark:bg-[#1C1C1E]/30 text-white dark:text-[#1C1C1E] font-bold',
                  inMonth && !isT && (isSelected
                    ? 'text-white/75 dark:text-[#1C1C1E]/75'
                    : 'text-foreground/60'
                  )
                )}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      ))}
    </button>
  );
}
