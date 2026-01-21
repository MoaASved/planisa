import { useState } from 'react';
import { format } from 'date-fns';
import { Folder, Calendar, Clock, Trash2, X, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TaskEditPanelProps {
  task: Task;
  onClose: () => void;
}

export function TaskEditPanel({ task, onClose }: TaskEditPanelProps) {
  const { updateTask, deleteTask, hideTask, taskCategories } = useAppStore();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(task.time || '');

  const handleCategorySelect = (category: TaskCategory) => {
    updateTask(task.id, { category: category.name, color: category.color });
    setShowCategoryPicker(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { date });
  };

  const handleTimeChange = (time: string) => {
    setTempTime(time);
    updateTask(task.id, { time: time || undefined });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const currentCategory = taskCategories.find(c => c.name === task.category);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">Edit Task</span>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Category Picker */}
        <Popover open={showCategoryPicker} onOpenChange={setShowCategoryPicker}>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              'bg-secondary hover:bg-muted'
            )}>
              <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${currentCategory?.color || 'gray'}`)} />
              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground">{task.category}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 bg-card border-border" align="start">
            <div className="space-y-1">
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
                  <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${cat.color}`)} />
                  {cat.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              'bg-secondary hover:bg-muted',
              task.date ? 'text-foreground' : 'text-muted-foreground'
            )}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.date ? format(new Date(task.date), 'MMM d') : 'Date'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <CalendarComponent
              mode="single"
              selected={task.date ? new Date(task.date) : undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Time Picker */}
        <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              'bg-secondary hover:bg-muted',
              task.time ? 'text-foreground' : 'text-muted-foreground'
            )}>
              <Clock className="w-3.5 h-3.5" />
              <span>{task.time || 'Time'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 bg-card border-border" align="start">
            <input
              type="time"
              value={tempTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="flow-input"
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {/* Hide Button */}
        <button 
          onClick={() => { hideTask(task.id); onClose(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Hide</span>
        </button>

        {/* Delete Button */}
        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
