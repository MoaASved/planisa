import { useState, useRef, useCallback } from 'react';
import { format, isToday } from 'date-fns';
import { Calendar, Clock, Flag, Plus, X, Check, EyeOff, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { AnimatedCheckbox } from './AnimatedCheckbox';
import { TaskLongPressMenu } from './TaskLongPressMenu';
import { useHaptics } from '@/hooks/useHaptics';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

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

const HIDE_THRESHOLD = 80;
const DELETE_THRESHOLD = 160;
const MAX_SWIPE = 180;

export function SwipeableTaskCard({ task, onToggle }: SwipeableTaskCardProps) {
  const { toggleSubtask, addSubtask, removeSubtask, updateTask, hideTask, toggleTask } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const haptics = useHaptics();

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeCommitted, setSwipeCommitted] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const hapticFiredRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ─── Long press ───────────────────────────────────────────
  const startLongPress = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      haptics.medium();
      setShowLongPressMenu(true);
    }, 500);
  }, [haptics]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ─── Swipe ────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalRef.current = null;
    hapticFiredRef.current = false;
    setIsSwiping(true);
    startLongPress();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    cancelLongPress();
    const dx = startXRef.current - e.touches[0].clientX;
    const dy = Math.abs(startYRef.current - e.touches[0].clientY);

    // Determine direction on first significant move
    if (isHorizontalRef.current === null && (Math.abs(dx) > 5 || dy > 5)) {
      isHorizontalRef.current = Math.abs(dx) > dy;
    }

    if (!isHorizontalRef.current) return;

    // Only swipe left (positive dx)
    if (dx > 0) {
      const clamped = Math.min(dx, MAX_SWIPE);
      setSwipeOffset(clamped);

      // Haptic at thresholds
      if (!hapticFiredRef.current && clamped >= DELETE_THRESHOLD) {
        haptics.warning();
        hapticFiredRef.current = true;
      } else if (hapticFiredRef.current && clamped < DELETE_THRESHOLD) {
        hapticFiredRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    cancelLongPress();
    setIsSwiping(false);

    if (swipeOffset >= DELETE_THRESHOLD) {
      // Full swipe → delete
      haptics.error();
      deleteWithUndo('task', task);
      setSwipeOffset(0);
    } else if (swipeOffset >= HIDE_THRESHOLD) {
      // Half swipe → keep revealed
      setSwipeOffset(HIDE_THRESHOLD);
      setSwipeCommitted(true);
    } else {
      setSwipeOffset(0);
      setSwipeCommitted(false);
    }
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
    setSwipeCommitted(false);
  };

  const handleHide = () => {
    resetSwipe();
    if (!task.completed) toggleTask(task.id);
    hideTask(task.id);
    haptics.success();
  };

  const handleDelete = () => {
    resetSwipe();
    deleteWithUndo('task', task);
  };

  // ─── Title editing ────────────────────────────────────────
  const handleCardClick = () => {
    if (swipeCommitted) {
      resetSwipe();
      return;
    }
    if (isLongPressRef.current) return;
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed && !swipeCommitted) {
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

  const revealedWidth = swipeOffset >= DELETE_THRESHOLD ? MAX_SWIPE : HIDE_THRESHOLD;

  return (
    <div className="space-y-1.5">
      {/* ─── Swipeable row ─── */}
      <div className="relative overflow-hidden rounded-2xl" ref={cardRef}>

        {/* Action buttons behind the card (right side) */}
        <div
          className="absolute right-0 inset-y-0 flex items-stretch"
          style={{ width: revealedWidth }}
        >
          {/* Hide button */}
          <button
            onClick={handleHide}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 transition-colors active:bg-amber-600"
            style={{ minWidth: HIDE_THRESHOLD }}
          >
            <EyeOff className="w-4 h-4 text-white" />
            <span className="text-[10px] font-semibold text-white uppercase tracking-wide">Hide</span>
          </button>

          {/* Delete button — only visible when swipe past delete threshold */}
          {swipeOffset >= DELETE_THRESHOLD - 20 && (
            <button
              onClick={handleDelete}
              className="flex flex-col items-center justify-center gap-1 bg-red-500 transition-colors active:bg-red-600 rounded-r-2xl"
              style={{ width: MAX_SWIPE - HIDE_THRESHOLD }}
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span className="text-[10px] font-semibold text-white uppercase tracking-wide">Delete</span>
            </button>
          )}
        </div>

        {/* Task card */}
        <div
          className={cn(
            'flow-card-flat relative bg-card cursor-pointer transition-transform',
            !isSwiping && 'duration-300'
          )}
          style={{ transform: `translateX(${-swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
        >
          {/* Long-press menu — absolute positioned inside card */}
          {showLongPressMenu && (
            <div className="relative">
              <TaskLongPressMenu task={task} onClose={() => setShowLongPressMenu(false)} />
            </div>
          )}

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
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                {task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Subtasks section ─── */}
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

      {/* ─── Add subtask button / input ─── */}
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
              onBlur={() => {
                if (!newSubtask.trim()) setShowSubtaskInput(false);
              }}
              autoFocus
              placeholder="Add subtask..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/50"
            />
            <button type="submit" className="sr-only" />
          </form>
        ) : (
          <button
            onClick={() => setShowSubtaskInput(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1 px-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add subtask</span>
          </button>
        )}
      </div>
    </div>
  );
}
