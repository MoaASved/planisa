import { useState } from 'react';
import { Plus, X, CheckSquare, FileText, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  activeTab: string;
  onCreateTask: () => void;
  onCreateNote: () => void;
  onCreateEvent: () => void;
}

export function FloatingActionButton({ 
  activeTab, 
  onCreateTask, 
  onCreateNote, 
  onCreateEvent 
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show on home tab - other tabs use direct action
  if (activeTab !== 'home') {
    return null;
  }

  const actions = [
    { id: 'task', label: 'New Task', icon: CheckSquare, onClick: onCreateTask },
    { id: 'event', label: 'New Event', icon: CalendarPlus, onClick: onCreateEvent },
    { id: 'note', label: 'New Note', icon: FileText, onClick: onCreateNote },
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

      {/* Bottom Sheet Style Actions */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 z-50 flow-bottom-sheet animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Create New</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full bg-secondary"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.onClick)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB - only visible when sheet is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flow-fab right-4 bottom-24"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
}