import { useState, useRef } from 'react';
import { format, isToday } from 'date-fns';
import { Check, Calendar, Clock, Flag, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface SwipeableTaskCardProps {
  task: Task;
  onToggle: () => void;
  onHide: () => void;
  onClick: () => void;
}

const priorityColors = {
  none: 'text-muted-foreground',
  low: 'text-pastel-mint',
  medium: 'text-pastel-amber',
  high: 'text-pastel-coral',
};

export function SwipeableTaskCard({ task, onToggle, onHide, onClick }: SwipeableTaskCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    // Only allow swiping left (positive diff)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset >= SWIPE_THRESHOLD) {
      // Trigger hide
      setIsHiding(true);
      setTimeout(() => {
        onHide();
      }, 300);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        isHiding && "animate-slide-out-right opacity-0"
      )}
    >
      {/* Hidden action behind */}
      <div className="absolute right-0 inset-y-0 flex items-center justify-center w-20 bg-red-500 rounded-r-2xl">
        <EyeOff className="w-5 h-5 text-white" />
      </div>

      {/* Task card */}
      <div
        className={cn(
          "flow-card-flat relative bg-card cursor-pointer transition-transform",
          !isSwiping && "duration-200"
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
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
                task.completed && 'text-muted-foreground'
              )}>
                {task.title}
              </p>
              {task.priority !== 'none' && (
                <Flag className={cn('w-4 h-4 flex-shrink-0', priorityColors[task.priority])} />
              )}
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
  );
}
