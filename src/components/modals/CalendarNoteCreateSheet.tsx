import { useState, useEffect, useRef } from 'react';
import { EmojiPicker, useEmojiPicker } from '@/components/ui/EmojiPicker';
import { format } from 'date-fns';
import { X, Calendar as CalendarIcon, Clock, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { pastelColors, getColorDotClass } from '@/lib/colors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FolderPickerSheet } from '@/components/notes/FolderPickerSheet';

interface CalendarNoteCreateSheetProps {
  date: Date;
  time: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenInNotes: (note: Note) => void;
  initialTitle?: string;
}

export function CalendarNoteCreateSheet({ date, time, isOpen, onClose, onOpenInNotes, initialTitle }: CalendarNoteCreateSheetProps) {
  const { addNote, folders } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PastelColor>('none');
  const [folder, setFolder] = useState('');
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const manualColorSet = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titlePicker = useEmojiPicker(titleRef, title, setTitle);
  const contentPicker = useEmojiPicker(contentRef, content, setContent);
  const [localDate, setLocalDate] = useState<Date>(date);
  const [localTime, setLocalTime] = useState<string>(time);
  const [localEndTime, setLocalEndTime] = useState<string>(() => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialTitle ?? '');
    setContent('');
    setColor('none');
    setFolder('');
    manualColorSet.current = false;
    setLocalDate(date);
    setLocalTime(time);
    if (time) {
      const [h, m] = time.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      setLocalEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else {
      setLocalEndTime('');
    }
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
        color,
        folder: folder || undefined,
        date: localDate,
        time: localTime || undefined,
        endTime: localEndTime || undefined,
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
      color,
      folder: folder || undefined,
      date: localDate,
      time: localTime,
      endTime: localEndTime,
      isPinned: false,
      showInCalendar: true,
    });
    const notesList = useAppStore.getState().notes;
    const created = notesList[notesList.length - 1];
    if (created) onOpenInNotes(created);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={saveAndClose}
      />

      {/* Card pinned near top so keyboard cannot overlap it */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[440px] z-[1200] bg-[#F8F7F4] dark:bg-background rounded-3xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: '15%',
          maxHeight: '70vh',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Top bar: editable date/time + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground active:opacity-70 transition-opacity">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(localDate, 'MMM d, yyyy')}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <Calendar
                  mode="single"
                  selected={localDate}
                  onSelect={(d) => { if (d) setLocalDate(d); }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground active:opacity-70 transition-opacity">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{localTime || 'Time'}</span>
                  {localTime && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setLocalTime(''); setLocalEndTime(''); }}
                      className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                <input
                  type="time"
                  value={localTime}
                  onChange={(e) => setLocalTime(e.target.value)}
                  className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm border-0 outline-none"
                />
              </PopoverContent>
            </Popover>
            {localTime && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground active:opacity-70 transition-opacity">
                    <span>{localEndTime || 'End'}</span>
                    {localEndTime && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); setLocalEndTime(''); }}
                        className="w-3.5 h-3.5 rounded-full hover:bg-black/10 flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                  <input
                    type="time"
                    value={localEndTime}
                    onChange={(e) => setLocalEndTime(e.target.value)}
                    className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm border-0 outline-none"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
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
            ref={titleRef}
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
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            className="w-full h-full bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/40 min-h-[300px]"
          />
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-6 border-t border-border/30 flex-shrink-0 space-y-3">
          {/* Color + folder row */}
          <div className="flex items-center gap-2">
            {/* Color picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-all active:scale-95">
                  <div className={cn('w-5 h-5 rounded-full', getColorDotClass(color))} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                <div className="flex flex-wrap gap-2 max-w-[200px]">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { manualColorSet.current = true; setColor(c.value); }}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        c.class,
                        color === c.value && 'ring-2 ring-offset-2 ring-foreground/50'
                      )}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Folder picker */}
            <button
              onClick={() => setShowFolderPicker(true)}
              className="h-8 px-3 rounded-full bg-secondary flex items-center gap-1 text-sm text-foreground transition-all active:scale-95"
            >
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className={folder ? 'text-foreground' : 'text-muted-foreground'}>
                {folder || 'Folder'}
              </span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleOpenInNotes}
              className="flex-1 py-3 rounded-2xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98] transition-all"
            >
              Open in Notes
            </button>
            <button
              onClick={saveAndClose}
              className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <FolderPickerSheet
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        selectedFolder={folder}
        onSelectFolder={(f) => {
          const name = f || '';
          setFolder(name);
          if (!manualColorSet.current && name) {
            const folderData = folders.find(fl => fl.name === name);
            if (folderData?.color) setColor(folderData.color);
          }
          setShowFolderPicker(false);
        }}
      />
      <EmojiPicker {...titlePicker} />
      <EmojiPicker
        {...contentPicker}
        anchorRect={contentPicker.anchorRect
          ? new DOMRect(
              contentPicker.anchorRect.left + 8,
              contentPicker.anchorRect.top + 24,
              0,
              24,
            )
          : null
        }
      />
    </>
  );
}
