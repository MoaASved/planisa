import { useState } from 'react';
import { Plus, FileText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesFABProps {
  onCreateNote: () => void;
  onCreateStickyNote: () => void;
}

export function NotesFAB({ onCreateNote, onCreateStickyNote }: NotesFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Menu */}
      <div className="fixed bottom-24 right-4 z-50">
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-card rounded-2xl shadow-lg border border-border p-2 min-w-[180px] animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleAction(onCreateNote)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-medium block">Note</span>
                <span className="text-xs text-muted-foreground">Full editor</span>
              </div>
            </button>
            <button
              onClick={() => handleAction(onCreateStickyNote)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-pastel-yellow/30 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-pastel-amber" />
              </div>
              <div className="text-left">
                <span className="font-medium block">Sticky Note</span>
                <span className="text-xs text-muted-foreground">Quick note</span>
              </div>
            </button>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg',
            'flex items-center justify-center transition-all active:scale-95',
            'hover:shadow-xl'
          )}
        >
          <Plus className={cn('w-6 h-6 transition-transform duration-200', isOpen && 'rotate-45')} />
        </button>
      </div>
    </>
  );
}