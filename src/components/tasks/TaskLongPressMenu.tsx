import { useRef, useEffect } from 'react';
import { Folder, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TaskLongPressMenuProps {
  task: Task;
  onClose: () => void;
}

export function TaskLongPressMenu({ task, onClose }: TaskLongPressMenuProps) {
  const { updateTask, taskCategories } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [onClose]);

  const handleCategorySelect = (cat: TaskCategory) => {
    updateTask(task.id, { category: cat.name, color: cat.color });
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { date });
    onClose();
  };

  const handleTimeSelect = (time: string) => {
    updateTask(task.id, { time: time || undefined });
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 left-9 right-0 top-1 animate-scale-in"
    >
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Category */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Folder className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">List</p>
                <p className="text-xs text-muted-foreground truncate">{task.category || 'None'}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2 bg-card border-border z-[60]" align="start" side="right">
            <div className="space-y-1">
              <button
                onClick={() => { updateTask(task.id, { category: '', color: 'gray' }); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                No list
              </button>
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    task.category === cat.name
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', `bg-pastel-${cat.color}`)} />
                  {cat.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-px bg-border/50 mx-4" />

        {/* Date */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Date</p>
                <p className="text-xs text-muted-foreground">
                  {task.date ? format(new Date(task.date), 'MMM d, yyyy') : 'No date'}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border z-[60]" align="start" side="right">
            <CalendarComponent
              mode="single"
              selected={task.date ? new Date(task.date) : undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="h-px bg-border/50 mx-4" />

        {/* Time */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">Time</p>
            <input
              type="time"
              defaultValue={task.time || ''}
              onChange={(e) => handleTimeSelect(e.target.value)}
              className="text-xs bg-secondary rounded-lg px-2 py-1 border-0 outline-none text-foreground w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
