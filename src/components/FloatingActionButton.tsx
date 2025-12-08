import { useState } from 'react';
import { Plus, X, CheckSquare, FileText, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onCreateTask: () => void;
  onCreateNote: () => void;
  onCreateEvent: () => void;
}

export function FloatingActionButton({ onCreateTask, onCreateNote, onCreateEvent }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'task', label: 'New Task', icon: CheckSquare, onClick: onCreateTask, color: 'bg-flow-coral' },
    { id: 'note', label: 'New Note', icon: FileText, onClick: onCreateNote, color: 'bg-flow-lavender' },
    { id: 'event', label: 'New Event', icon: CalendarPlus, onClick: onCreateEvent, color: 'bg-flow-mint' },
  ];

  const handleAction = (onClick: () => void) => {
    setIsOpen(false);
    onClick();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons */}
      <div className="fixed right-6 bottom-28 z-50 flex flex-col-reverse items-center gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.onClick)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-medium transition-all duration-300',
                action.color,
                isOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              )}
              style={{ 
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                boxShadow: '0 4px 20px -4px hsl(var(--foreground) / 0.2)'
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flow-fab right-6 bottom-28 z-50',
          isOpen && 'rotate-45'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </>
  );
}