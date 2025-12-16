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
}

export function CalendarHeader({
  currentDate,
  view,
  showYearView,
  onPrev,
  onNext,
  onMonthClick,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <button
          onClick={onMonthClick}
          className="text-lg font-semibold text-foreground hover:opacity-70 transition-opacity min-w-[140px] text-center"
        >
          {format(currentDate, 'MMMM yyyy')}
        </button>
        
        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-secondary/60 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* View icons */}
      {!showYearView && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewChange('month')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'month' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-secondary/60'
            )}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onViewChange('weekday')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'weekday' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-secondary/60'
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}