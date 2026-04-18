import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PastelColor } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { pastelColors } from '@/lib/colors';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string;
}

export function CreateListModal({ isOpen, onClose, editingId }: CreateListModalProps) {
  const { addTaskCategory, updateTaskCategory, taskCategories } = useAppStore();
  const editing = editingId ? taskCategories.find((c) => c.id === editingId) : undefined;
  const [name, setName] = useState('');
  const [color, setColor] = useState<PastelColor>('sky');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editing?.name ?? '');
      setColor(editing?.color ?? 'sky');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updateTaskCategory(editing.id, { name: trimmed, color });
    } else {
      addTaskCategory({ name: trimmed, color, sortMode: 'manual' });
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[6px] animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex items-center justify-center px-5"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-sm bg-card rounded-3xl p-5 shadow-2xl animate-spring-pop"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-modal-title">
              {editing ? 'Edit list' : 'New list'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="List name"
            className="w-full bg-secondary border-0 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 mb-4"
          />

          <p className="flow-label mb-2.5 px-1">Color</p>
          <div className="grid grid-cols-6 gap-2.5 mb-5">
            {pastelColors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  'aspect-square rounded-full transition-all',
                  c.class,
                  color === c.value
                    ? 'ring-2 ring-offset-2 ring-foreground/60 scale-105'
                    : 'hover:scale-105',
                )}
                aria-label={c.label}
              />
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-40 transition-opacity"
          >
            {editing ? 'Save' : 'Create list'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
