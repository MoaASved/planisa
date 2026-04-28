import { useState } from 'react';
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

  if (!isOpen) return null;

  const saveAndClose = () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }
    addNote({
      title: title.trim() || '',
      content: content.trim() ? content.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('') : '',
      type: 'note' as const,
      tags: [],
      date,
      time,
      isPinned: false,
      showInCalendar: true,
    });
    onClose();
  };

  const handleOpenInNotes = () => {
    addNote({
      title: title.trim() || '',
      content: content.trim() ? content.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('') : '',
      type: 'note' as const,
      tags: [],
      date,
      time,
      isPinned: false,
      showInCalendar: true,
    });
    const notes = useAppStore.getState().notes;
    const created = notes[notes.length - 1];
    if (created) onOpenInNotes(created);
  };

  const dateDisplay = format(date, 'MMMM d, yyyy');

  return (
    <>
      <div className="fixed inset-0 z-[1100]" onClick={saveAndClose} />
      <div className="fixed inset-x-0 bottom-0 z-[1200] animate-slide-up">
        <div
          className="bg-[#F8F7F4] dark:bg-background rounded-t-[32px] flex flex-col overflow-hidden"
          style={{ maxHeight: '72vh', boxShadow: '0 -16px 60px rgba(0,0,0,0.22), 0 -2px 8px rgba(0,0,0,0.08)' }}
        >
          {/* Top bar: date + close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground">{dateDisplay} · {time}</span>
            <button
              onClick={saveAndClose}
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
              autoFocus
              className="w-full bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 border-0 outline-none"
            />
          </div>

          <div className="h-px bg-border/50 mx-5 flex-shrink-0" />

          {/* Content textarea */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something…"
              className="w-full h-full bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 min-h-[120px]"
            />
          </div>

          {/* Open in Notes button */}
          <div className="px-5 pt-3 pb-8 border-t border-border/30 flex-shrink-0">
            <button
              onClick={handleOpenInNotes}
              className="w-full py-3 rounded-2xl bg-foreground text-background text-sm font-semibold active:scale-[0.98] transition-all"
            >
              Open in Notes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
