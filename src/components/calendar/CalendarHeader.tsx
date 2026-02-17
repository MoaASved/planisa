import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type SimpleView = 'month' | 'weekday';

interface CalendarHeaderProps {
  currentDate: Date;
  view: SimpleView;
  showYearView: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMonthClick: () => void;
  onViewChange: (view: SimpleView) => void;
  onTodayClick: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  showYearView,
  onPrev,
  onNext,
  onMonthClick,
  onViewChange,
  onTodayClick,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background">
      {/* Month navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-secondary/40 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/50" />
        </button>
        
        <button
          onClick={onMonthClick}
          className="text-lg font-semibold text-foreground hover:opacity-70 transition-opacity min-w-[140px] text-center tracking-tight"
        >
          {format(currentDate, 'MMMM yyyy')}
        </button>
        
        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-secondary/40 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground/50" />
        </button>
      </div>

      {/* View icons + Today button */}
      {!showYearView && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewChange('month')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'month' 
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]' 
                : 'text-foreground/40 hover:bg-secondary/40'
            )}
          >
            <Grid3X3 className="w-4.5 h-4.5" />
          </button>
          
          <button
            onClick={() => onViewChange('weekday')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'weekday' 
                ? 'bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]' 
                : 'text-foreground/40 hover:bg-secondary/40'
            )}
          >
            <List className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onTodayClick}
            className="ml-1 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-secondary/40 transition-all tracking-wide"
          >
            Idag
          </button>
        </div>
      )}
    </div>
  );
}
