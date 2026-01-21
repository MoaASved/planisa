import { useState, useRef } from 'react';
import { format, isToday } from 'date-fns';
import { Check, Calendar, Clock, Flag, EyeOff, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { TaskEditPanel } from './TaskEditPanel';

interface SwipeableTaskCardProps {
  task: Task;
  onToggle: () => void;
  onHide: () => void;
}

const priorityColors = {
  none: 'text-muted-foreground',
  low: 'text-pastel-mint',
  medium: 'text-pastel-amber',
  high: 'text-pastel-coral',
};

export function SwipeableTaskCard({ task, onToggle, onHide }: SwipeableTaskCardProps) {
  const { toggleSubtask, addSubtask, removeSubtask } = useAppStore();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    
    // Swipe left (positive diff) → Hide action
    // Swipe right (negative diff) → Edit action
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    } else if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (swipeOffset >= SWIPE_THRESHOLD) {
      // Swipe left → Hide
      setIsHiding(true);
      setTimeout(() => {
        onHide();
      }, 300);
    } else if (swipeOffset <= -SWIPE_THRESHOLD) {
      // Swipe right → Show edit panel
      setShowEditPanel(true);
      setSwipeOffset(0);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleCardClick = () => {
    if (swipeOffset === 0 && !showEditPanel) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
      subtaskInputRef.current?.focus();
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
    if (e.key === 'Escape') {
      setNewSubtask('');
    }
  };

  return (
    <div className="space-y-2">
      <div 
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-300",
          isHiding && "animate-slide-out-right opacity-0"
        )}
      >
        {/* Hidden action behind - LEFT (hide) */}
        <div className="absolute right-0 inset-y-0 flex items-center justify-center w-20 bg-red-500 rounded-r-2xl">
          <EyeOff className="w-5 h-5 text-white" />
        </div>

        {/* Hidden action behind - RIGHT (edit indicator) */}
        <div className="absolute left-0 inset-y-0 flex items-center justify-center w-20 bg-primary rounded-l-2xl">
          <span className="text-xs font-medium text-primary-foreground">Edit</span>
        </div>

        {/* Task card */}
        <div
          className={cn(
            "flow-card-flat relative bg-card cursor-pointer transition-transform",
            !isSwiping && "duration-200"
          )}
          style={{ transform: `translateX(${-swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={handleCheckboxClick}
              className={cn(
                'mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0',
                task.completed 
                  ? 'bg-primary border-primary' 
                  : 'border-muted-foreground hover:border-primary'
              )}
            >
              {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn(
                  'font-medium transition-all duration-200',
                  task.completed && 'text-muted-foreground line-through'
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.priority !== 'none' && (
                    <Flag className={cn('w-4 h-4', priorityColors[task.priority])} />
                  )}
                  {(task.subtasks.length > 0) && (
                    isExpanded 
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn('flow-badge', `flow-badge-${task.color}`)}>
                  {task.category}
                </span>
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

      {/* Expanded subtasks section */}
      {isExpanded && !showEditPanel && (
        <div className="ml-9 space-y-2 animate-fade-in">
          {task.subtasks.map((subtask) => (
            <div 
              key={subtask.id}
              className="flex items-center gap-2 p-2 bg-secondary/50 rounded-xl group"
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
          
          {/* Add subtask input */}
          <div className="flex items-center gap-2 p-2">
            <div className="w-5 h-5 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center flex-shrink-0">
              <Plus className="w-3 h-3 text-muted-foreground/50" />
            </div>
            <input
              ref={subtaskInputRef}
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
              placeholder="Add subtask..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      )}

      {/* Edit panel (shown after swipe right) */}
      {showEditPanel && (
        <div className="animate-fade-in">
          <TaskEditPanel 
            task={task} 
            onClose={() => setShowEditPanel(false)} 
          />
        </div>
      )}
    </div>
  );
}
