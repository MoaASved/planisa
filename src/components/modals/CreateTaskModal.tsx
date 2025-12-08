import { useState } from 'react';
import { X, Plus, Calendar, Clock, Tag, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor, Priority } from '@/types';
import { pastelColors } from '@/lib/colors';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorities: { value: Priority; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask, categories } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Work');
  const [color, setColor] = useState<PastelColor>(categories[0]?.color || 'sky');
  const [priority, setPriority] = useState<Priority>('none');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      completed: false,
      date: date ? new Date(date) : undefined,
      time: time || undefined,
      category,
      color,
      priority,
      notes: notes || undefined,
      subtasks: subtasks.map((s, i) => ({ id: `sub-${i}`, title: s, completed: false })),
    });

    // Reset form
    setTitle('');
    setDate('');
    setTime('');
    setCategory(categories[0]?.name || 'Work');
    setColor(categories[0]?.color || 'sky');
    setPriority('none');
    setNotes('');
    setSubtasks([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">New Task</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
            autoFocus
          />

          {/* Date & Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flow-input"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flow-input"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.name); setColor(cat.color); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    category === cat.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    c.class,
                    color === c.value && 'ring-2 ring-offset-2 ring-primary'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Flag className="w-4 h-4" /> Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    priority === p.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Subtasks</label>
            <div className="space-y-2">
              {subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2">
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                  <span className="text-sm flex-1">{s}</span>
                  <button onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="flow-input flex-1"
                />
                <button onClick={handleAddSubtask} className="p-2 rounded-xl bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="flow-input resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}