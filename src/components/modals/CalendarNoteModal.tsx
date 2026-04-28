import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';

interface CalendarNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEditor: (note: Note) => void;
}

export function CalendarNoteModal({ note, isOpen, onClose, onOpenFullEditor }: CalendarNoteModalProps) {
  const { updateNote, deleteNote } = useAppStore();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (note) setTitle(note.title === 'Untitled' ? '' : (note.title || ''));
  }, [note]);

  if (!isOpen || !note) return null;

  const isNotebookPage = note.id.startsWith('nbp-');

  const handleSave = () => {
    if (!isNotebookPage) updateNote(note.id, { title: title.trim() });
    onClose();
  };

  const handleDelete = () => {
    if (!isNotebookPage) deleteNote(note.id);
    onClose();
  };

  const handleOpen = () => {
    if (!isNotebookPage) updateNote(note.id, { title: title.trim() });
    onOpenFullEditor(note);
  };

  const dateDisplay = note.date
    ? format(new Date(note.date), 'MMMM d, yyyy')
    : null;

  const timeDisplay = note.time ? ` · ${note.time}` : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleSave}
      />

      {/* Centered card */}
      <div
        className="fixed left-4 right-4 z-[1200] bg-[#F8F7F4] dark:bg-background rounded-3xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          maxHeight: '70vh',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Top bar: date + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {dateDisplay}{timeDisplay}
          </span>
          <button
            onClick={handleSave}
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
            placeholder=""
            disabled={isNotebookPage}
            className="w-full bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 border-0 outline-none disabled:opacity-60"
          />
        </div>

        <div className="h-px bg-border/50 mx-5 flex-shrink-0" />

        {/* Read-only content preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {note.content ? (
            <div
              className="tiptap-editor pointer-events-none select-none"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <p className="text-muted-foreground/50 text-sm italic">No content</p>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 pt-3 pb-6 border-t border-border/30 flex-shrink-0 flex gap-3">
          {!isNotebookPage && (
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Save
          </button>
          <button
            onClick={handleOpen}
            className="flex-1 py-3 rounded-2xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Open
          </button>
        </div>
      </div>
    </>
  );
}
