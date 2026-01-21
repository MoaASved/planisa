import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface InlineTaskInputProps {
  onTaskCreated?: (taskId: string) => void;
}

export function InlineTaskInput({ onTaskCreated }: InlineTaskInputProps) {
  const { addTask, taskCategories } = useAppStore();
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const defaultCategory = taskCategories[0];
    
    addTask({
      title: title.trim(),
      completed: false,
      category: defaultCategory?.name || 'Personal',
      color: defaultCategory?.color || 'gray',
      subtasks: [],
      priority: 'none',
    });

    setTitle('');
    // Keep focus for quick successive entries
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      inputRef.current?.blur();
    }
  };

  return (
    <div 
      className={cn(
        'flow-card-flat transition-all duration-200',
        isFocused && 'ring-2 ring-primary/20'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0',
          isFocused ? 'border-primary' : 'border-muted-foreground/40'
        )}>
          <Plus className={cn(
            'w-4 h-4 transition-colors',
            isFocused ? 'text-primary' : 'text-muted-foreground/40'
          )} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50 font-medium"
        />
      </div>
    </div>
  );
}

