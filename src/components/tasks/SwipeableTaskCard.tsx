import { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import {
  Calendar, Clock, Flag, Plus, X, Check,
  EyeOff, Trash2, MoreVertical, Folder, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task, TaskCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { useHaptics } from '@/hooks/useHaptics';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ReactDOM from 'react-dom';

interface SwipeableTaskCardProps {
  task: Task;
  onToggle: () => void;
  collapseSignal?: number;
}

const priorityColors = {
  none: 'text-muted-foreground',
  low: 'text-pastel-mint',
  medium: 'text-pastel-amber',
  high: 'text-pastel-coral',
};

// ─── Centered portal overlay for sub-selections ──────────────
interface PortalOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

function PortalOverlay({ children, onClose }: PortalOverlayProps) {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[1600] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Content – stop propagation so clicking inside doesn't close */}
      <div
        className="relative z-[1601] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

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
    const menuHeight = 240;

    let top = rect.bottom + 6;
    let left = rect.right - menuWidth;

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
    setSubMenu(null);
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { date });
    setSubMenu(null);
    onClose();
  };

  const handleTimeSelect = (time: string) => {
    updateTask(task.id, { time: time || undefined });
  };

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[1400] animate-in fade-in zoom-in-95 duration-150"
      style={menuStyle}
    >
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden">

        {/* Category */}
        <button
          onClick={() => setSubMenu('category')}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Folder className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Category</p>
            <p className="text-xs text-muted-foreground truncate">{task.category || 'None'}</p>
          </div>
        </button>

        <div className="h-px bg-border/40 mx-4" />

        {/* Date */}
        <button
          onClick={() => setSubMenu('date')}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
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

  return (
    <>
      {ReactDOM.createPortal(menu, document.body)}

      {/* Category picker overlay */}
      {subMenu === 'category' && (
        <PortalOverlay onClose={() => setSubMenu(null)}>
          <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden w-56">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-semibold text-foreground">Select Category</p>
            </div>
            <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
              <button
                onClick={() => { updateTask(task.id, { category: '', color: 'gray' }); setSubMenu(null); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                No category
              </button>
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
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
          </div>
        </PortalOverlay>
      )}

      {/* Date picker overlay */}
      {subMenu === 'date' && (
        <PortalOverlay onClose={() => setSubMenu(null)}>
          <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-semibold text-foreground">Select Date</p>
            </div>
            <CalendarComponent
              mode="single"
              selected={task.date ? new Date(task.date) : undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </div>
        </PortalOverlay>
      )}
    </>
  );
}

// ─── Main card ───────────────────────────────────────────────
export function SwipeableTaskCard({ task, onToggle, collapseSignal }: SwipeableTaskCardProps) {
  const { toggleSubtask, addSubtask, removeSubtask, updateTask, hideTask, toggleTask } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const haptics = useHaptics();

  const [showMenu, setShowMenu] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isExpanded, setIsExpanded] = useState(true);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-collapse when signal changes (new task created elsewhere)
  useEffect(() => {
    if (collapseSignal !== undefined && collapseSignal > 0) {
      setIsExpanded(false);
      setShowSubtaskInput(false);
    }
  }, [collapseSignal]);

  // Focus subtask input when shown
  useEffect(() => {
    if (showSubtaskInput) {
      setTimeout(() => subtaskInputRef.current?.focus(), 50);
    }
  }, [showSubtaskInput]);

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
      setIsExpanded(true);
      subtaskInputRef.current?.focus();
    }
  };

  // ─── Plus icon click → open subtask input ─────────────────
  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtaskInput(true);
    setIsExpanded(true);
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

  // Whether this task has subtasks
  const hasSubtasks = task.subtasks.length > 0;

  return (
    <div className="space-y-1.5">
      {/* ─── Task card ─── */}
      <div className="flow-card-flat relative bg-card">
        <div className="flex items-start gap-3">
          {/* Checkbox — isolated */}
          <div onClick={(e) => e.stopPropagation()}>
            <AnimatedCheckbox
              checked={task.completed}
              onChange={onToggle}
              className="mt-0.5"
            />
          </div>

          {/* Clickable row area */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (hasSubtasks && !isEditingTitle) setIsExpanded(v => !v);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={handleTitleSave}
                  className="font-medium bg-transparent border-0 outline-none w-full cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p
                  onClick={(e) => { e.stopPropagation(); handleTitleClick(e); }}
                  className={cn(
                    'font-medium transition-all duration-200',
                    !task.completed && 'cursor-text hover:text-primary/80',
                    task.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {task.title}
                </p>
              )}

              {/* Right-side icons: plus OR chevron, then three-dot */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {task.priority !== 'none' && (
                  <Flag className={cn('w-4 h-4', priorityColors[task.priority])} />
                )}

                {/* Plus icon (no subtasks yet) or Chevron (has subtasks) */}
                {!hasSubtasks ? (
                  <button
                    onClick={handlePlusClick}
                    className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-colors"
                    aria-label="Add subtask"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v); }}
                    className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-colors"
                    aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                  >
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronRight className="w-4 h-4" />}
                  </button>
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

      {/* ─── Subtasks ─── */}
      {isExpanded && hasSubtasks && (
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

      {/* ─── Add subtask input (shown when plus clicked or after first subtask) ─── */}
      {isExpanded && showSubtaskInput && (
        <div className="ml-9">
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
              placeholder="Add subtask..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/50"
            />
            <button type="submit" className="sr-only" />
          </form>
        </div>
      )}

      {/* ─── "Add subtask" trigger after subtask list (only when has subtasks and not already showing input) ─── */}
      {isExpanded && hasSubtasks && !showSubtaskInput && (
        <div className="ml-9">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSubtaskInput(true); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors py-1 px-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add subtask</span>
          </button>
        </div>
      )}
    </div>
  );
}
