import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Plus, Calendar, Clock, Tag, Flag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, PastelColor, Priority } from '@/types';
import { pastelColors } from '@/lib/colors';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const priorities: { value: Priority; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function EditTaskModal({ task, isOpen, onClose }: EditTaskModalProps) {
  const { updateTask, deleteTask, taskCategories, addTaskCategory } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<PastelColor>('sky');
  const [priority, setPriority] = useState<Priority>('none');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<PastelColor>('sky');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date ? format(new Date(task.date), 'yyyy-MM-dd') : '');
      setTime(task.time || '');
      setCategory(task.category);
      setColor(task.color);
      setPriority(task.priority);
      setNotes(task.notes || '');
      setSubtasks([...task.subtasks]);
    }
  }, [task]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: `sub-${Date.now()}`, title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      addTaskCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setCategory(newCategoryName.trim());
      setColor(newCategoryColor);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleSave = () => {
    if (!task || !title.trim()) return;

    updateTask(task.id, {
      title: title.trim(),
      date: date ? new Date(date) : undefined,
      time: time || undefined,
      category,
      color,
      priority,
      notes: notes || undefined,
      subtasks,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flow-input" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flow-input" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.name); setColor(cat.color); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    category === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${cat.color}`)} />
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewCategory(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-primary hover:bg-muted transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>

            {showNewCategory && (
              <div className="mt-3 p-3 bg-secondary rounded-xl space-y-3 animate-fade-in">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="flow-input" />
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((c) => (
                    <button key={c.value} onClick={() => setNewCategoryColor(c.value)} className={cn('w-7 h-7 rounded-full transition-all', c.class, newCategoryColor === c.value && 'ring-2 ring-offset-2 ring-primary')} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCategory(false)} className="flex-1 px-3 py-2 rounded-xl text-sm bg-muted text-muted-foreground">Cancel</button>
                  <button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="flex-1 px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground disabled:opacity-50">Add</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color (override)</label>
            <div className="flex flex-wrap gap-2">
              {pastelColors.map((c) => (
                <button key={c.value} onClick={() => setColor(c.value)} className={cn('w-8 h-8 rounded-full transition-all', c.class, color === c.value && 'ring-2 ring-offset-2 ring-primary')} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Flag className="w-4 h-4" /> Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn('flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all', priority === p.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Subtasks</label>
            <div className="space-y-2">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2">
                  <div
                    onClick={() => setSubtasks(subtasks.map(st => st.id === s.id ? { ...st, completed: !st.completed } : st))}
                    className={cn('w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center', s.completed ? 'bg-primary border-primary' : 'border-muted-foreground')}
                  >
                    {s.completed && <span className="text-xs text-primary-foreground">✓</span>}
                  </div>
                  <span className={cn('text-sm flex-1', s.completed && 'line-through text-muted-foreground')}>{s.title}</span>
                  <button onClick={() => setSubtasks(subtasks.filter(st => st.id !== s.id))}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="Add subtask..." className="flow-input flex-1" />
                <button onClick={handleAddSubtask} className="p-2 rounded-xl bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} className="flow-input resize-none" />
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 space-y-2">
          <button onClick={handleSave} disabled={!title.trim()} className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
          <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}