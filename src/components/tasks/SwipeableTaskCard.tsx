import { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import {
  Calendar, Clock, Flag, Plus, X, Check,
  EyeOff, Trash2, MoreVertical, Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { useHaptics } from '@/hooks/useHaptics';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReactDOM from 'react-dom';

interface SwipeableTaskCardProps {
  task: Task;
  onToggle: () => void;
}

const priorityColors = {
  none: 'text-muted-foreground',
  low: 'text-pastel-mint',
  medium: 'text-pastel-amber',
  high: 'text-pastel-coral',
};

// ─── Three-dot popup menu ────────────────────────────────────
interface TaskMenuProps {
  task: Task;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onHide: () => void;
  onDelete: () => void;
}

function TaskMenu({ task, anchorRef, onClose, onHide, onDelete }: TaskMenuProps) {
  const { updateTask, taskCategories } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [subMenu, setSubMenu] = useState<'category' | 'date' | 'time' | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  // Position menu near the anchor button
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const menuWidth = 220;
    const menuHeight = 240; // approx

    let top = rect.bottom + 6;
    let left = rect.right - menuWidth;

    // Keep inside viewport
    if (left < 8) left = 8;
    if (left + menuWidth > vw - 8) left = vw - menuWidth - 8;
    if (top + menuHeight > vh - 80) top = rect.top - menuHeight - 6;

    setMenuStyle({ top, left, width: menuWidth });
  }, [anchorRef]);

  // Close on outside tap
  useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', handle);
      document.addEventListener('touchstart', handle);
    }, 50);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [onClose, anchorRef]);

  const handleCategorySelect = (cat: TaskCategory) => {
    updateTask(task.id, { category: cat.name, color: cat.color });
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { date });
    onClose();
  };

  const handleTimeSelect = (time: string) => {
    updateTask(task.id, { time: time || undefined });
    onClose();
  };

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[1400] animate-in fade-in zoom-in-95 duration-150"
      style={menuStyle}
    >
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden">

        {/* Category */}
        <Popover open={subMenu === 'category'} onOpenChange={(o) => setSubMenu(o ? 'category' : null)}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Folder className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Category</p>
                <p className="text-xs text-muted-foreground truncate">{task.category || 'None'}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2 bg-card border-border z-[1500]" align="end" side="left">
            <div className="space-y-1">
              <button
                onClick={() => { updateTask(task.id, { category: '', color: 'gray' }); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                No category
              </button>
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    task.category === cat.name
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', `bg-pastel-${cat.color}`)} />
                  {cat.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-px bg-border/40 mx-4" />

        {/* Date */}
        <Popover open={subMenu === 'date'} onOpenChange={(o) => setSubMenu(o ? 'date' : null)}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Date</p>
                <p className="text-xs text-muted-foreground">
                  {task.date ? format(new Date(task.date), 'MMM d, yyyy') : 'No date'}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border z-[1500]" align="end" side="left">
            <CalendarComponent
              mode="single"
              selected={task.date ? new Date(task.date) : undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="h-px bg-border/40 mx-4" />

        {/* Time */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-1">Time</p>
            <input
              type="time"
              defaultValue={task.time || ''}
              onChange={(e) => handleTimeSelect(e.target.value)}
              className="text-xs bg-secondary rounded-lg px-2 py-1 border-0 outline-none text-foreground w-full"
            />
          </div>
        </div>

        <div className="h-px bg-border/40 mx-4" />

        {/* Hide */}
        <button
          onClick={() => { onHide(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Hide task</p>
        </button>

        <div className="h-px bg-border/40 mx-4" />

        {/* Delete */}
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/5 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">Delete</p>
        </button>

      </div>
    </div>
  );

  return ReactDOM.createPortal(menu, document.body);
}

// ─── Main card ───────────────────────────────────────────────
export function SwipeableTaskCard({ task, onToggle }: SwipeableTaskCardProps) {
  const { toggleSubtask, addSubtask, removeSubtask, updateTask, hideTask, toggleTask } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const haptics = useHaptics();

  const [showMenu, setShowMenu] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ─── Title editing ────────────────────────────────────────
  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      setIsEditingTitle(true);
      setEditedTitle(task.title);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const handleTitleSave = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleTitleSave(); }
    if (e.key === 'Escape') { setEditedTitle(task.title); setIsEditingTitle(false); }
  };

  // ─── Subtasks ─────────────────────────────────────────────
  const handleAddSubtask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
      subtaskInputRef.current?.focus();
    }
  };

  // ─── Hide / Delete ────────────────────────────────────────
  const handleHide = () => {
    if (!task.completed) toggleTask(task.id);
    hideTask(task.id);
    haptics.success();
  };

  const handleDelete = () => {
    deleteWithUndo('task', task);
  };

  return (
    <div className="space-y-1.5">
      {/* ─── Task card ─── */}
      <div className="flow-card-flat relative bg-card">
        <div className="flex items-start gap-3">
          <AnimatedCheckbox
            checked={task.completed}
            onChange={onToggle}
            className="mt-0.5"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleSave}
                  className="font-medium bg-transparent border-0 outline-none w-full"
                />
              ) : (
                <p
                  onClick={handleTitleClick}
                  className={cn(
                    'font-medium transition-all duration-200',
                    !task.completed && 'cursor-text hover:text-primary/80',
                    task.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {task.title}
                </p>
              )}

              <div className="flex items-center gap-1 flex-shrink-0">
                {task.priority !== 'none' && (
                  <Flag className={cn('w-4 h-4', priorityColors[task.priority])} />
                )}
                {/* Three-dot menu button */}
                <button
                  ref={menuButtonRef}
                  onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-colors"
                  aria-label="Task options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {task.category && (
                <span className={cn('flow-badge', `flow-badge-${task.color}`)}>
                  {task.category}
                </span>
              )}
              {task.date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {isToday(new Date(task.date)) ? 'Today' : format(new Date(task.date), 'MMM d')}
                </span>
              )}
              {task.time && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {task.time}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Three-dot popup ─── */}
      {showMenu && (
        <TaskMenu
          task={task}
          anchorRef={menuButtonRef}
          onClose={() => setShowMenu(false)}
          onHide={handleHide}
          onDelete={handleDelete}
        />
      )}

      {/* ─── Subtasks (always expanded) ─── */}
      {task.subtasks.length > 0 && (
        <div className="ml-9 space-y-1.5">
          {task.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl group"
            >
              <button
                onClick={() => toggleSubtask(task.id, subtask.id)}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                  subtask.completed
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/50 hover:border-primary'
                )}
              >
                {subtask.completed && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className={cn(
                'flex-1 text-sm',
                subtask.completed && 'line-through text-muted-foreground'
              )}>
                {subtask.title}
              </span>
              <button
                onClick={() => removeSubtask(task.id, subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-all"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add subtask ─── */}
      <div className="ml-9">
        {showSubtaskInput ? (
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-xl">
            <div className="w-5 h-5 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
              <Plus className="w-3 h-3 text-muted-foreground/50" />
            </div>
            <input
              ref={subtaskInputRef}
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onBlur={() => { if (!newSubtask.trim()) setShowSubtaskInput(false); }}
              autoFocus
              placeholder="Add subtask..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/50"
            />
            <button type="submit" className="sr-only" />
          </form>
        ) : (
          <button
            onClick={() => setShowSubtaskInput(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1 px-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add subtask</span>
          </button>
        )}
      </div>
    </div>
  );
}
