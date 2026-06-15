import { format, getWeek, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Grid3X3, List, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

type SimpleView = 'month' | 'weekday';
type DesktopView = 'day' | 'week' | 'month' | 'year';

interface CalendarHeaderProps {
  currentDate: Date;
  view: SimpleView;
  showYearView: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMonthClick: () => void;
  onViewChange: (view: SimpleView) => void;
  onTodayClick: () => void;
  desktopView?: DesktopView;
  onDesktopViewChange?: (view: DesktopView) => void;
  isListMode?: boolean;
  onListModeToggle?: () => void;
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
  desktopView,
  onDesktopViewChange,
  isListMode,
  onListModeToggle,
}: CalendarHeaderProps) {
  const weekNumber = (view === 'weekday' || desktopView === 'week' || desktopView === 'day')
    ? getWeek(startOfWeek(currentDate, { weekStartsOn: 1 }), { weekStartsOn: 1 })
    : null;

  const desktopTitle = desktopView === 'year'
    ? format(currentDate, 'yyyy')
    : format(currentDate, 'MMMM yyyy');

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background md:bg-transparent pt-safe-2 px-safe">
      {/* Month navigation */}
      <div className="flex items-center gap-1">
        {/* Prev button: always on desktop, hidden on mobile year view */}
        <button
          onClick={onPrev}
          className={cn(
            'p-2 rounded-full hover:bg-secondary/40 transition-colors',
            showYearView && 'hidden md:inline-flex'
          )}
        >
          <ChevronLeft className="w-5 h-5 text-foreground/50" />
        </button>

        {/* Mobile: clickable month title */}
        <button
          onClick={onMonthClick}
          className={cn(
            'md:hidden text-[17px] font-semibold tracking-tight text-foreground hover:opacity-70 transition-opacity text-center',
            showYearView ? 'pl-1 min-w-0' : 'min-w-[140px]'
          )}
        >
          {format(currentDate, 'MMMM yyyy')}
        </button>

        {/* Desktop: non-interactive title */}
        <span className="hidden md:block text-[17px] font-semibold tracking-tight text-foreground pl-1 min-w-[140px] text-center">
          {desktopTitle}
        </span>

        {/* Next button: always on desktop, hidden on mobile year view */}
        <button
          onClick={onNext}
          className={cn(
            'p-2 rounded-full hover:bg-secondary/40 transition-colors',
            showYearView && 'hidden md:inline-flex'
          )}
        >
          <ChevronRight className="w-5 h-5 text-foreground/50" />
        </button>

        {weekNumber && (
          <span className="hidden md:inline-block ml-1 text-xs font-medium text-muted-foreground/40 tracking-wide">
            W{weekNumber}
          </span>
        )}
      </div>

      {/* Mobile controls (icon buttons + Today) */}
      {!showYearView && (
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => onViewChange('month')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'month'
                ? 'bg-[#1C1C1E] dark:bg-muted text-white dark:text-foreground'
                : 'text-muted-foreground hover:bg-secondary/40'
            )}
          >
            <Grid3X3 className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => onViewChange('weekday')}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              view === 'weekday'
                ? 'bg-[#1C1C1E] dark:bg-muted text-white dark:text-foreground'
                : 'text-muted-foreground hover:bg-secondary/40'
            )}
          >
            <List className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onTodayClick}
            className="ml-1 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-secondary/40 transition-all tracking-wide"
          >
            Today
          </button>
        </div>
      )}

      {/* Desktop controls (pill segmented control + list toggle + Today) */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center rounded-full bg-secondary/30 p-0.5">
          {(['day', 'week', 'month', 'year'] as DesktopView[]).map(v => (
            <button
              key={v}
              onClick={() => onDesktopViewChange?.(v)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition-all',
                desktopView === v
                  ? 'bg-[#1C1C1E] dark:bg-muted text-white dark:text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'day' ? 'Day' : v === 'week' ? 'Week' : v === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>

        {(desktopView === 'week' || desktopView === 'day') && (
          <button
            onClick={onListModeToggle}
            title={isListMode ? 'Switch to grid' : 'Switch to list'}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isListMode
                ? 'bg-[#1C1C1E] dark:bg-muted text-white dark:text-foreground'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40'
            )}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onTodayClick}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-secondary/40 transition-all tracking-wide"
        >
          Today
        </button>
      </div>
    </div>
  );
}
