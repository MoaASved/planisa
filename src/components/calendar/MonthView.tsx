import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  getWeek
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, CalendarEvent, Note, PastelColor } from '@/types';
import { getColorDotClass } from '@/lib/colors';

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  getItemColor: (item: Task | CalendarEvent, type: 'task' | 'event') => PastelColor;
  getNoteColor: (note: Note) => PastelColor;
  onDayClick: (date: Date) => void;
}

export function MonthView({
  currentDate,
  selectedDate,
  events,
  tasks,
  notes,
  getItemColor,
  getNoteColor,
  onDayClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
    const dayTasks = tasks.filter(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);
    const dayNotes = notes.filter(n => n.date && format(new Date(n.date), 'yyyy-MM-dd') === dateStr);
    return { events: dayEvents, tasks: dayTasks, notes: dayNotes };
  };

  return (
    <div className="animate-fade-in flex-1 flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-8 mb-2">
        <div className="text-center text-[10px] font-normal text-muted-foreground/40 py-2">W</div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid - flex-1 to take remaining space */}
      <div className="flex-1 flex flex-col">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-8 flex-1">
            {/* Week number */}
            <div className="flex items-center justify-center text-[10px] font-normal text-muted-foreground/30">
              {getWeek(week[0], { weekStartsOn: 1 })}
            </div>
            
            {week.map((day, dayIndex) => {
              const { events: dayEvents, tasks: dayTasks, notes: dayNotes } = getItemsForDate(day);
              const hasItems = dayEvents.length > 0 || dayTasks.length > 0 || dayNotes.length > 0;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={dayIndex}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'p-1 rounded-xl flex flex-col items-center justify-start pt-2 transition-all duration-200 min-h-[52px]',
                    !isCurrentMonth && 'opacity-30',
                    isToday(day) && 'bg-primary text-primary-foreground',
                    isSelected && !isToday(day) && 'bg-primary/15 ring-2 ring-primary/50',
                    !isToday(day) && !isSelected && 'hover:bg-secondary/60'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    isToday(day) ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasItems && (
                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center max-w-full">
                      {dayEvents.slice(0, 2).map((event, j) => (
                        <div 
                          key={j} 
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(event, 'event'))
                          )} 
                        />
                      ))}
                      {dayTasks.filter(t => !t.completed).slice(0, 2).map((task, j) => (
                        <div 
                          key={`t-${j}`} 
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getItemColor(task, 'task'))
                          )} 
                        />
                      ))}
                      {dayNotes.slice(0, 1).map((note, j) => (
                        <div 
                          key={`n-${j}`} 
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isToday(day) ? 'bg-primary-foreground/70' : getColorDotClass(getNoteColor(note))
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
