import { useState, useRef } from 'react';
import { Check, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface SwipeableCompletedCardProps {
  task: Task;
  onUnhide: () => void;
  onDelete: () => void;
}

export function SwipeableCompletedCard({ task, onUnhide, onDelete }: SwipeableCompletedCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;
    
    // Only swipe right (negative diff) → Delete action
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (swipeOffset <= -SWIPE_THRESHOLD) {
      // Swipe right → Delete
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    }
    setSwipeOffset(0);
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        isDeleting && "opacity-0 scale-95"
      )}
    >
      {/* Hidden action behind - RIGHT (delete) */}
      <div className="absolute left-0 inset-y-0 flex items-center justify-center w-20 bg-red-500 rounded-l-2xl">
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      {/* Task card */}
      <div
        className={cn(
          "flow-card-flat relative bg-card opacity-60 transition-transform",
          !isSwiping && "duration-200"
        )}
        style={{ transform: `translateX(${-swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-lg border-2 flex items-center justify-center',
              task.completed ? 'bg-primary border-primary' : 'border-muted-foreground'
            )}>
              {task.completed && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
            <div>
              <p className="font-medium text-muted-foreground line-through">{task.title}</p>
              {task.category && (
                <span className={cn('flow-badge mt-1', `flow-badge-${task.color}`)}>
                  {task.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onUnhide}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title="Unhide task"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
