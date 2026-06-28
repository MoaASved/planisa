import { useState, useRef } from 'react';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { EmojiPicker, useEmojiPicker } from '@/components/ui/EmojiPicker';

interface InlineNewTaskRowProps {
  onSubmit: (title: string) => void;
  onDismiss: () => void;
}

export function InlineNewTaskRow({ onSubmit, onDismiss }: InlineNewTaskRowProps) {
  const [title, setTitle] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const titlePicker = useEmojiPicker(ref, title, setTitle);

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
        autoFocus
        type="text"
        value={title}
        onChange={(e) => { const v = e.target.value; setTitle(v.length === 1 ? v.toUpperCase() : v); }}
        onBlur={() => { if (!titlePicker.isOpen) submit(); }}
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
      <EmojiPicker {...titlePicker} />
    </div>
  );
}
