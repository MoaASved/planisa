import { useState, useRef, useEffect } from 'react';
import { AnimatedCheckbox } from './AnimatedCheckbox';

interface InlineNewTaskRowProps {
  onSubmit: (title: string) => void;
  onDismiss: () => void;
}

export function InlineNewTaskRow({ onSubmit, onDismiss }: InlineNewTaskRowProps) {
  const [title, setTitle] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

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
    <div className="flex items-center gap-3 px-4 py-2.5">
      <AnimatedCheckbox checked={false} onChange={() => {}} />
      <input
        ref={ref}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            onDismiss();
          }
        }}
        className="flex-1 bg-transparent border-0 outline-none text-[15px] font-medium text-foreground"
      />
    </div>
  );
}
