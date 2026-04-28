import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';

interface CalendarNoteCreateSheetProps {
  date: Date;
  time: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenInNotes: (note: Note) => void;
}

export function CalendarNoteCreateSheet({ date, time, isOpen, onClose, onOpenInNotes }: CalendarNoteCreateSheetProps) {
  const { addNote } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setContent('');
  }, [isOpen]);

  if (!isOpen) return null;

  const buildContent = () =>
    content.trim() ? content.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('') : '';

  const saveAndClose = () => {
    if (title.trim() || content.trim()) {
      addNote({
        title: title.trim() || '',
        content: buildContent(),
        type: 'note' as const,
        tags: [],
        date,
        time,
        isPinned: false,
        showInCalendar: true,
      });
    }
    onClose();
  };

  const handleOpenInNotes = () => {
    addNote({
      title: title.trim() || '',
      content: buildContent(),
      type: 'note' as const,
      tags: [],
      date,
      time,
      isPinned: false,
      showInCalendar: true,
    });
    const notesList = useAppStore.getState().notes;
    const created = notesList[notesList.length - 1];
    if (created) onOpenInNotes(created);
  };

  const dateDisplay = format(date, 'MMMM d, yyyy');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={saveAndClose}
      />

      {/* Card pinned near top so keyboard cannot overlap it */}
      <div
        className="fixed left-4 right-4 z-[1200] bg-[#F8F7F4] dark:bg-background rounded-3xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: 16,
          maxHeight: '55vh',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Top bar: date/time + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground">{dateDisplay} · {time}</span>
          <button
            onClick={saveAndClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title field — no autoFocus so keyboard doesn't open immediately */}
        <div className="px-5 pb-3 flex-shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder=""
            className="w-full bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 border-0 outline-none"
          />
        </div>

        <div className="h-px bg-border/50 mx-5 flex-shrink-0" />

        {/* Content textarea — no autoFocus */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            className="w-full h-full bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 min-h-[100px]"
          />
        </div>

        {/* Footer buttons */}
        <div className="px-5 pt-3 pb-6 border-t border-border/30 flex-shrink-0 flex gap-3">
          <button
            onClick={saveAndClose}
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Save
          </button>
          <button
            onClick={handleOpenInNotes}
            className="flex-1 py-3 rounded-2xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-all"
          >
            Open in Notes
          </button>
        </div>
      </div>
    </>
  );
}
