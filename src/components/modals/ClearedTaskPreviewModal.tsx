import { format } from 'date-fns';
import { Check, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types';

interface ClearedTaskPreviewModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClearedTaskPreviewModal({ task, isOpen, onClose }: ClearedTaskPreviewModalProps) {
  const { deleteTask } = useAppStore();

  if (!isOpen || !task) return null;

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />
      <div
        className="fixed left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-[480px] z-[1200] bg-[#F8F7F4] dark:bg-background rounded-3xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: '20%',
          maxHeight: '60vh',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Cleared task</span>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-3 overflow-y-auto">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary border-primary border-2 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
            <p className="text-base font-medium line-through text-muted-foreground leading-snug">
              {task.title}
            </p>
          </div>

          {/* Date / time */}
          {task.date && (
            <div className="flex items-center gap-4 pl-8">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
                <CalendarIcon className="w-3.5 h-3.5" />
                {format(new Date(task.date), 'MMM d, yyyy')}
              </span>
              {task.time && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground/70">
                  <Clock className="w-3.5 h-3.5" />
                  {task.time}{task.endTime ? ` – ${task.endTime}` : ''}
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {(task.note || task.notes) && (
            <p className="pl-8 text-sm text-muted-foreground/80 whitespace-pre-wrap">
              {task.note ?? task.notes}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
