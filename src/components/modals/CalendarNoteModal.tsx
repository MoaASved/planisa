import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';

interface CalendarNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEditor: (note: Note) => void;
}

export function CalendarNoteModal({ note, isOpen, onClose, onOpenFullEditor }: CalendarNoteModalProps) {
  const { updateNote } = useAppStore();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (note) setTitle(note.title);
  }, [note]);

  if (!isOpen || !note) return null;

  const isNotebookPage = note.id.startsWith('nbp-');

  const saveTitle = () => {
    if (!isNotebookPage) {
      updateNote(note.id, { title: title.trim() });
    }
  };

  const handleClose = () => {
    saveTitle();
    onClose();
  };

  const handleOpen = () => {
    saveTitle();
    onOpenFullEditor(note);
  };

  const dateDisplay = note.date
    ? format(new Date(note.date), 'MMMM d, yyyy')
    : null;

  return (
    <>
      {/* Tap-away backdrop */}
      <div className="fixed inset-0 z-[1100]" onClick={handleClose} />

      {/* Preview card — bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[1200] animate-slide-up">
        <div
          className="bg-[#F8F7F4] dark:bg-background rounded-t-[24px] flex flex-col overflow-hidden"
          style={{ maxHeight: '72vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.10)' }}
        >
          {/* Top bar: date + close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {dateDisplay}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Title field */}
          <div className="px-5 pb-3 flex-shrink-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title…"
              className="w-full bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 border-0 outline-none"
            />
          </div>

          <div className="h-px bg-border/50 mx-5 flex-shrink-0" />

          {/* Read-only content preview */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {note.content ? (
              <div
                className="tiptap-content prose prose-sm max-w-none text-foreground pointer-events-none select-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            ) : (
              <p className="text-muted-foreground/50 text-sm italic">No content</p>
            )}
          </div>

          {/* Open button */}
          <div className="px-5 pt-3 pb-8 border-t border-border/30 flex-shrink-0">
            <button
              onClick={handleOpen}
              className="w-full py-3 rounded-2xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-all"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
