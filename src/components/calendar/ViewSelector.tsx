import { cn } from '@/lib/utils';
import { CalendarView } from '@/types';

interface ViewSelectorProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const views: { id: CalendarView; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'day', label: 'Day' },
];

export function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center bg-secondary/60 backdrop-blur-sm rounded-full p-1 gap-0.5">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ease-out',
              view === v.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
