import ReactDOM from 'react-dom';
import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export interface HabitRow {
  id: string;
  name: string;
  color: string;
}

interface HabitsEditSheetProps {
  isOpen: boolean;
  habits: HabitRow[];
  onClose: () => void;
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function HabitsEditSheet({ isOpen, habits, onClose, onAdd, onUpdate, onDelete }: HabitsEditSheetProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) { setIsAddingNew(false); setNewName(''); }
  }, [isOpen]);

  useEffect(() => {
    if (isAddingNew) setTimeout(() => newInputRef.current?.focus(), 60);
  }, [isAddingNew]);

  const commitNew = () => {
    const name = newName.trim();
    if (name) { onAdd(name); }
    setNewName('');
    setIsAddingNew(false);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[1200] bg-card rounded-t-3xl pb-safe flex flex-col"
        style={{ maxHeight: '80vh' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <h2 className="flow-modal-title">Habits</h2>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Done
          </button>
        </div>

        {/* Habit list */}
        <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-4">
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3">
              <input
                type="text"
                defaultValue={habit.name}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== habit.name) onUpdate(habit.id, val);
                  else if (!val) e.target.value = habit.name; // revert if empty
                }}
                className="flex-1 bg-transparent text-sm text-foreground outline-none border-0 min-w-0"
              />
              <button
                onClick={() => onDelete(habit.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95 transition-all flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Inline new habit input */}
          {isAddingNew && (
            <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3">
              <input
                ref={newInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitNew(); if (e.key === 'Escape') { setIsAddingNew(false); setNewName(''); } }}
                onBlur={commitNew}
                placeholder="Habit name"
                className="flex-1 bg-transparent text-sm text-foreground outline-none border-0 placeholder:text-muted-foreground/50 min-w-0"
              />
            </div>
          )}

          {/* Add habit button */}
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 text-sm text-primary px-1 py-2 active:opacity-70 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add habit
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
