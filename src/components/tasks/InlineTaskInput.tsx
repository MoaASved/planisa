import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export type InlineTaskInputMode = 'today' | 'priority' | 'uncategorized';

interface InlineTaskInputProps {
  mode?: InlineTaskInputMode;
  onTaskCreated?: (taskId: string) => void;
  onDismiss?: () => void;
  autoFocus?: boolean;
}

const PLACEHOLDERS: Record<InlineTaskInputMode, string> = {
  today: 'Write a task...',
  priority: 'Important task...',
  uncategorized: 'Add a task...',
};

export function InlineTaskInput({
  mode = 'uncategorized',
  onTaskCreated,
  onDismiss,
  autoFocus,
}: InlineTaskInputProps) {
  const { addTask } = useAppStore();
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onDismiss?.();
      return;
    }

    addTask({
      title: trimmedTitle,
      completed: false,
      category: '',
      color: 'gray',
      subtasks: [],
      priority: mode === 'priority' ? 'high' : 'none',
      date: mode === 'today' ? new Date() : undefined,
    });

    setTitle('');
    onTaskCreated?.('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={cn(
          'flow-card-flat transition-all duration-200',
          isFocused && 'ring-2 ring-primary/20',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0',
              isFocused ? 'border-primary' : 'border-muted-foreground/40',
            )}
          >
            <Plus
              className={cn(
                'w-4 h-4 transition-colors',
                isFocused ? 'text-primary' : 'text-muted-foreground/40',
              )}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              const trimmed = title.trim();
              if (trimmed) {
                const form = e.currentTarget.closest('form');
                form?.requestSubmit();
              } else {
                onDismiss?.();
              }
            }}
            placeholder={PLACEHOLDERS[mode]}
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50 font-medium"
          />
          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
        </div>
      </div>
    </form>
  );
}
