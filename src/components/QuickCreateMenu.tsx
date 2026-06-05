import { CheckSquare, CalendarPlus, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateEvent: () => void;
  onCreateNote: () => void;
  onCreateStickyNote: () => void;
  /** When provided, positions the menu next to this rect (desktop sidebar button). */
  anchorRect?: DOMRect | null;
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
  anchorRect,
}: QuickCreateMenuProps) {
  if (!isOpen) return null;

  const MENU_WIDTH = 200;
  const MENU_GAP = 8;

  // Compute desktop position when anchorRect is supplied
  const desktopStyle = (() => {
    if (!anchorRect) return null;
    let left = anchorRect.right + MENU_GAP;
    const top = anchorRect.top;
    // Flip left if overflowing right edge
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = anchorRect.left - MENU_WIDTH - MENU_GAP;
    }
    return { left, top };
  })();

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
        className="fixed z-[1200] animate-spring-pop"
        style={desktopStyle
          ? { left: desktopStyle.left, top: desktopStyle.top }
          : { left: '50%', bottom: 'calc(48px + 76px + 16px)', transform: 'translateX(-50%)' }
        }
      >
        <div
          className="bg-[#1C1C1E] dark:bg-[#1C1A18]"
          style={{
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
                  'hover:bg-white/10 active:bg-white/15',
                  index < actions.length - 1 && 'border-b border-white/10 dark:border-border'
                )}
                style={{ padding: '14px 24px' }}
              >
                <Icon className="w-5 h-5 text-white/70 dark:text-foreground/70" />
                <span className="text-sm font-medium text-white dark:text-foreground">
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