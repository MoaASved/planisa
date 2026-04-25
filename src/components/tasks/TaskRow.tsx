import { useState, useRef, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import {
  Calendar, Clock, MoreVertical, Folder, Trash2, Star,
} from 'lucide-react';
import ReactDOM from 'react-dom';
import { cn } from '@/lib/utils';
import { Task, TaskCategory } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { useHaptics } from '@/hooks/useHaptics';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  /** Compact = used inside narrow carousel cards */
  compact?: boolean;
  /** Show overdue indicator when task date < today */
  showOverdue?: boolean;
  className?: string;
}

// ─── Centered modal portal ────────────────────────────────────
function PortalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex items-center justify-center px-4"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div
          className="animate-in fade-in zoom-in-95 duration-150"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Three-dot menu ────────────────────────────────────────────
interface TaskMenuProps {
  task: Task;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onDelete: () => void;
  onOpenList: () => void;
  onOpenDate: () => void;
  onTogglePriority: () => void;
}

function TaskMenu({ task, anchorRef, onClose, onDelete, onOpenList, onOpenDate, onTogglePriority }: TaskMenuProps) {
  const { updateTask } = useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = 240;
    const h = 300;
    let top = rect.bottom + 6;
    let left = rect.right - w;
    if (left < 8) left = 8;
    if (left + w > vw - 8) left = vw - w - 8;
    if (top + h > vh - 80) top = Math.max(8, rect.top - h - 6);
    setMenuStyle({ top, left, width: w });
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose, anchorRef]);

  const isPriority = task.priority !== 'none';

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="fixed animate-in fade-in zoom-in-95 duration-150"
      style={{ ...menuStyle, zIndex: 1400 }}
    >
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* List */}
        <button
          onClick={onOpenList}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Folder className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Change list</p>
            <p className="text-xs text-muted-foreground truncate">{task.category || 'None'}</p>
          </div>
        </button>

        <div className="h-px bg-border/40 mx-4" />

        {/* Date */}
        <button
          onClick={onOpenDate}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Change date</p>
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
            <p className="text-sm font-medium text-foreground mb-1">Change time</p>
            <input
              type="time"
              defaultValue={task.time || ''}
              onChange={(e) => updateTask(task.id, { time: e.target.value || undefined })}
              className="text-xs bg-secondary rounded-lg px-2 py-1 border-0 outline-none text-foreground w-full"
            />
          </div>
        </div>

        <div className="h-px bg-border/40 mx-4" />

        {/* Priority toggle */}
        <button
          onClick={() => { onTogglePriority(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
        >
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
            isPriority ? 'bg-amber-500/15' : 'bg-secondary',
          )}>
            <Star className={cn(
              'w-3.5 h-3.5',
              isPriority ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground',
            )} />
          </div>
          <p className="text-sm font-medium text-foreground">
            {isPriority ? 'Remove Priority' : 'Mark as Priority'}
          </p>
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
    </div>,
    document.body,
  );
}

// ─── Main row ─────────────────────────────────────────────────
export function TaskRow({ task, onToggle, compact = false, showOverdue = false, className }: TaskRowProps) {
  const { updateTask, taskCategories } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const haptics = useHaptics();

  const [showMenu, setShowMenu] = useState(false);
  const [subMenu, setSubMenu] = useState<'list' | 'date' | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isPriority = task.priority !== 'none';
  const isOverdue = showOverdue && task.date && !task.completed &&
    new Date(task.date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  // Title edit
  const saveTitle = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== task.title) updateTask(task.id, { title: trimmed });
    setIsEditingTitle(false);
  };

  const handleTogglePriority = () => {
    updateTask(task.id, { priority: isPriority ? 'none' : 'high' });
    haptics.success();
  };

  const handleDelete = () => deleteWithUndo('task', task);

  const handleListSelect = (cat: TaskCategory) => {
    updateTask(task.id, { category: cat.name, color: cat.color });
    setSubMenu(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { date });
    setSubMenu(null);
  };

  return (
    <div className={cn('flow-card-flat relative bg-card', isPriority && 'ring-1 ring-amber-500/20', className)}>
      {/* Priority accent line on left edge */}
      {isPriority && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-500/70" aria-hidden="true" />
      )}

      <div className="flex items-start gap-3">
        <div onClick={(e) => e.stopPropagation()} className="self-start">
          <AnimatedCheckbox checked={task.completed} onChange={onToggle} className="mt-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); saveTitle(); }
                  if (e.key === 'Escape') { setEditedTitle(task.title); setIsEditingTitle(false); }
                }}
                className="font-medium bg-transparent border-0 outline-none w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  if (!task.completed) {
                    setEditedTitle(task.title);
                    setIsEditingTitle(true);
                  }
                }}
                className={cn(
                  'font-medium transition-all duration-200 truncate',
                  !task.completed && 'cursor-text hover:text-primary/80',
                  task.completed && 'text-muted-foreground line-through',
                )}
              >
                {task.title}
              </p>
            )}

            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {isPriority && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-label="Priority" />
              )}
              <button
                ref={menuButtonRef}
                onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
                className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/60 transition-colors"
                aria-label="Task options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtle meta line */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.category && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <span className={cn('w-1.5 h-1.5 rounded-full', `bg-pastel-${task.color}`)} />
                {task.category}
              </span>
            )}
            {task.date && !compact && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <Calendar className="w-3 h-3" />
                {isToday(new Date(task.date)) ? 'Today' : format(new Date(task.date), 'MMM d')}
              </span>
            )}
            {task.time && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <Clock className="w-3 h-3" />
                {task.time}
              </span>
            )}
            {isOverdue && (
              <span className="text-[11px] font-medium text-destructive">Overdue</span>
            )}
          </div>
        </div>
      </div>

      {showMenu && (
        <TaskMenu
          task={task}
          anchorRef={menuButtonRef}
          onClose={() => setShowMenu(false)}
          onDelete={handleDelete}
          onOpenList={() => { setShowMenu(false); setSubMenu('list'); }}
          onOpenDate={() => { setShowMenu(false); setSubMenu('date'); }}
          onTogglePriority={handleTogglePriority}
        />
      )}

      {subMenu === 'list' && (
        <PortalOverlay onClose={() => setSubMenu(null)}>
          <div className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden w-64">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-semibold text-foreground">Select List</p>
            </div>
            <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
              <button
                onClick={() => { updateTask(task.id, { category: '', color: 'gray' }); setSubMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors text-left"
              >
                No list
              </button>
              {taskCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleListSelect(cat)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left',
                    task.category === cat.name ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
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
              className="p-3"
            />
          </div>
        </PortalOverlay>
      )}
    </div>
  );
}
