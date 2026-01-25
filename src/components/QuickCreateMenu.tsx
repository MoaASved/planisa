import { CheckSquare, CalendarPlus, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateEvent: () => void;
  onCreateNote: () => void;
  onCreateStickyNote: () => void;
}

const actions = [
  { id: 'event', label: 'Event', icon: CalendarPlus },
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'note', label: 'Note', icon: FileText },
  { id: 'sticky', label: 'Sticky', icon: StickyNote },
] as const;

export function QuickCreateMenu({
  isOpen,
  onClose,
  onCreateTask,
  onCreateEvent,
  onCreateNote,
  onCreateStickyNote,
}: QuickCreateMenuProps) {
  if (!isOpen) return null;

  const handleAction = (id: string) => {
    switch (id) {
      case 'task':
        onCreateTask();
        break;
      case 'event':
        onCreateEvent();
        break;
      case 'note':
        onCreateNote();
        break;
      case 'sticky':
        onCreateStickyNote();
        break;
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-pop-in">
        <div className="bg-card rounded-3xl shadow-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-5 rounded-2xl',
                    'bg-secondary/50 hover:bg-secondary active:scale-95',
                    'transition-all duration-150'
                  )}
                >
                  <Icon className="w-6 h-6 text-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
