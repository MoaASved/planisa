import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineNewTaskRowProps {
  onSubmit: (title: string) => void;
  onDismiss: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InlineNewTaskRow({
  onSubmit,
  onDismiss,
  placeholder = 'New task',
  autoFocus = true,
}: InlineNewTaskRowProps) {
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const submit = () => {
    const t = title.trim();
    if (t) {
      onSubmit(t);
      setTitle('');
      setTimeout(() => ref.current?.focus(), 0);
    } else {
      onDismiss();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-card rounded-2xl transition-all',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        focused && 'ring-2 ring-primary/20',
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          focused ? 'border-primary' : 'border-muted-foreground/40',
        )}
      >
        <Plus
          className={cn(
            'w-3 h-3',
            focused ? 'text-primary' : 'text-muted-foreground/40',
          )}
        />
      </div>
      <input
        ref={ref}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          submit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            onDismiss();
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 outline-none text-[15px] font-medium text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
