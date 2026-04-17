import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';
import { X, Calendar, Clock, Star, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, Subtask } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListId?: string;
  editingTaskId?: string;
}

export function AddTaskModal({ isOpen, onClose, defaultListId, editingTaskId }: AddTaskModalProps) {
  const { addTask, updateTask, deleteTask, taskCategories, tasks } = useAppStore();
  const editing = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : undefined;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState(false);
  const [listId, setListId] = useState<string>('');
  const [subs, setSubs] = useState<Subtask[]>([]);
  const [newSub, setNewSub] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endTimeManual = useRef(false);

  const addMinutes = (t: string, mins: number): string => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.min(Math.floor(total / 60), 23);
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setTitle(editing.title);
      setNote(editing.note ?? '');
      setDate(editing.date ? new Date(editing.date).toISOString().slice(0, 10) : '');
      setTime(editing.time ?? '');
      setEndTime(editing.endTime ?? '');
      endTimeManual.current = !!editing.endTime;
      setPriority(editing.priority !== 'none');
      const cat = taskCategories.find((c) => c.name === editing.category);
      setListId(cat?.id ?? '');
      setSubs(editing.subtasks);
    } else {
      setTitle('');
      setNote('');
      setDate('');
      setTime('');
      setEndTime('');
      endTimeManual.current = false;
      setPriority(false);
      setListId(defaultListId ?? taskCategories[0]?.id ?? '');
      setSubs([]);
    }
    setNewSub('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen, editing, defaultListId, taskCategories]);

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (!newTime) {
      setEndTime('');
      endTimeManual.current = false;
      return;
    }
    if (!endTimeManual.current || !endTime) {
      setEndTime(addMinutes(newTime, 30));
    }
  };

  const handleEndTimeChange = (v: string) => {
    endTimeManual.current = true;
    setEndTime(v);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const cat = taskCategories.find((c) => c.id === listId);
    const payload: Omit<Task, 'id' | 'createdAt'> = {
      title: trimmed,
      completed: editing?.completed ?? false,
      note: note.trim() || undefined,
      date: date ? new Date(date) : undefined,
      time: time || undefined,
      endTime: time ? (endTime || addMinutes(time, 30)) : undefined,
      category: cat?.name ?? '',
      color: cat?.color ?? 'gray',
      subtasks: subs,
      priority: priority ? 'high' : 'none',
    };
    if (editing) {
      updateTask(editing.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubs([...subs, { id: `s-${Date.now()}`, title: t, completed: false }]);
    setNewSub('');
  };

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[6px] animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex items-center justify-center px-4 py-6 overflow-y-auto"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-sm bg-card rounded-3xl shadow-2xl animate-spring-pop my-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {editing ? 'Edit task' : 'New task'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-5 pb-3 space-y-3 max-h-[70vh] overflow-y-auto">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full bg-transparent border-0 outline-none text-[17px] font-medium text-foreground placeholder:text-muted-foreground/60"
            />

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note"
              rows={2}
              className="w-full bg-secondary rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />

            {/* Subtasks */}
            <div className="space-y-1.5">
              {subs.map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="flex-1 text-sm text-foreground">{s.title}</span>
                  <button
                    onClick={() => setSubs(subs.filter((x) => x.id !== s.id))}
                    className="text-muted-foreground/50 hover:text-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 px-2">
                <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSub())}
                  placeholder="Add subtask"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* List */}
            <div className="bg-secondary rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">List</span>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-foreground text-right"
              >
                <option value="">No list</option>
                {taskCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <label className="relative bg-secondary rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer">
              <Calendar className="w-4 h-4 text-muted-foreground pointer-events-none" />
              <span className="text-xs font-medium text-muted-foreground pointer-events-none">Date</span>
              <span className="ml-auto text-sm text-foreground pointer-events-none">
                {date ? format(new Date(date + 'T00:00:00'), 'EEE, MMM d') : 'None'}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>

            {/* Time */}
            <label className="relative bg-secondary rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer">
              <Clock className="w-4 h-4 text-muted-foreground pointer-events-none" />
              <span className="text-xs font-medium text-muted-foreground pointer-events-none">Time</span>
              <span className="ml-auto text-sm text-foreground pointer-events-none">
                {time || 'None'}
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>

            {/* Ends */}
            {time && (
              <label className="relative bg-secondary rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer animate-fade-in">
                <Clock className="w-4 h-4 text-muted-foreground pointer-events-none" />
                <span className="text-xs font-medium text-muted-foreground pointer-events-none">Ends</span>
                <span className="ml-auto text-sm text-foreground pointer-events-none">
                  {endTime || addMinutes(time, 30)}
                </span>
                <input
                  type="time"
                  value={endTime || addMinutes(time, 30)}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            )}

            {/* Priority */}
            <button
              onClick={() => setPriority(!priority)}
              className={cn(
                'w-full rounded-xl px-3.5 py-2.5 flex items-center gap-2 transition-colors',
                priority ? 'bg-amber-500/15' : 'bg-secondary',
              )}
            >
              <Star
                className={cn(
                  'w-4 h-4',
                  priority ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  priority ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
                )}
              >
                Priority
              </span>
            </button>
          </div>

          <div className="p-5 pt-3 flex items-center gap-2">
            {editing && (
              <button
                onClick={() => {
                  deleteTask(editing.id);
                  onClose();
                }}
                className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-40 transition-opacity"
            >
              {editing ? 'Save' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
