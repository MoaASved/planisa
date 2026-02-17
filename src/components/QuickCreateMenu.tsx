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
        className="fixed inset-0 z-[1100] animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className="fixed left-1/2 z-[1200] animate-spring-pop"
        style={{
          bottom: 'calc(48px + 76px + 16px)',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            background: '#1C1C1E',
            borderRadius: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            minWidth: 200,
          }}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className={cn(
                  'flex items-center gap-3 w-full text-left transition-colors duration-150',
                  'hover:bg-white/10 active:bg-white/15'
                )}
                style={{
                  padding: '14px 24px',
                  borderBottom: index < actions.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}