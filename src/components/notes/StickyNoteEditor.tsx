import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { X, Calendar as CalendarIcon, Eye, EyeOff, Clock, Folder, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note, PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { FolderPickerSheet } from './FolderPickerSheet';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

interface StickyNoteEditorProps {
  note?: Note;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
  showCalendarToggle?: boolean;
}

const getStickyBgClass = (color?: PastelColor): string => {
  if (!color) return 'bg-pastel-yellow';
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-yellow';
};

export function StickyNoteEditor({ note, onClose, initialDate, initialTime, showCalendarToggle }: StickyNoteEditorProps) {
  const { addNote, updateNote, togglePinNote, folders } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();

  const [content, setContent] = useState(note?.content?.replace(/<[^>]*>/g, '') || '');
  const [color, setColor] = useState<PastelColor>(() => {
    if (note?.color) return note.color;
    const colors: PastelColor[] = ['coral', 'peach', 'amber', 'yellow', 'mint', 'teal', 'sky', 'lavender', 'rose', 'gray', 'stone'];
    return colors[Math.floor(Math.random() * colors.length)];
  });
  const [folder, setFolder] = useState(note?.folder || '');
  const [date, setDate] = useState<Date>(note?.date || initialDate || new Date());
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [showInCalendar, setShowInCalendar] = useState(note?.showInCalendar ?? !!initialDate);
  const [hasDateSelected, setHasDateSelected] = useState(!!(note?.date || initialDate));
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [time, setTime] = useState<string | undefined>(note?.time || initialTime);
  const [endTime, setEndTime] = useState<string | undefined>(() => {
    if (note?.endTime) return note.endTime;
    if (initialTime) {
      const [h, m] = initialTime.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      const endM = h >= 23 ? 59 : m;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    return undefined;
  });
  const endTimeManuallySet = useRef(false);

  const calculateEndTime = (startTime: string): string => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const endM = h >= 23 ? 59 : m;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleTimeChange = (val: string) => {
    setTime(val);
    if (!endTimeManuallySet.current) {
      setEndTime(calculateEndTime(val));
    }
  };

  const handleSave = () => {
    const noteData = {
      title: content.slice(0, 30) || 'Sticky Note',
      content,
      type: 'sticky' as const,
      folder,
      color,
      date,
      tags: [],
      isPinned,
      showInCalendar,
      time,
      endTime,
      hideFromAllNotes: false,
    };

    if (note) {
      updateNote(note.id, noteData);
    } else if (content.trim()) {
      addNote(noteData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (note) {
      deleteWithUndo('note', note);
    }
    onClose();
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    if (note) {
      togglePinNote(note.id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1100] animate-in fade-in-0 duration-200"
        onClick={handleSave}
      />
      
      {/* Sticky Note Modal */}
      <div 
        className={cn(
          'fixed left-4 right-4 z-[1200] rounded-3xl p-6 shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          getStickyBgClass(color)
        )}
        style={{
          top: '15%',
          maxHeight: '45vh',
        }}
      >
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleTogglePin}
            className={cn(
              'p-2 rounded-xl transition-all active:scale-95',
              isPinned ? 'bg-white/30' : 'bg-white/20'
            )}
          >
            <Star className={cn('w-5 h-5', isPinned && 'fill-current')} />
          </button>
          
          <button
            onClick={handleSave}
            className="p-2 rounded-xl bg-white/20 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none text-lg',
            'placeholder:text-foreground/40 text-foreground/90',
            'min-h-[150px] max-h-[300px]'
          )}
          
        />

        {/* Bottom actions */}
        <div className="pt-4 border-t border-foreground/10 space-y-2">
          {/* Row 1: color, folder */}
          <div className="flex items-center gap-2">
            {/* Color picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center transition-all active:scale-95">
                  <div className={cn('w-5 h-5 rounded-full', getStickyBgClass(color))} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                <div className="flex flex-wrap gap-2 max-w-[200px]">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
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

            {/* Folder */}
            <button 
              onClick={() => setShowFolderPicker(true)}
              className="h-8 px-3 rounded-full bg-white/30 flex items-center gap-1 text-sm transition-all active:scale-95"
            >
              <Folder className="w-4 h-4" />
              {folder || 'Folder'}
            </button>

          </div>


          {/* Row 2: date and times + delete */}
          <div className="flex items-center gap-1.5">
            {/* Show-in-calendar eye toggle — only in notes context */}
            {showCalendarToggle && (
              <button
                onClick={() => setShowInCalendar(prev => !prev)}
                className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              >
                {showInCalendar
                  ? <Eye className="w-3.5 h-3.5" />
                  : <EyeOff className="w-3.5 h-3.5 opacity-60" />
                }
              </button>
            )}

            {/* Date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  'h-7 px-2 rounded-full flex items-center gap-1 text-xs transition-all active:scale-95 whitespace-nowrap',
                  (showCalendarToggle ? hasDateSelected : showInCalendar) ? 'bg-white/40' : 'bg-white/30'
                )}>
                  <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  {(showCalendarToggle ? hasDateSelected : showInCalendar) && <span>{format(date, 'd MMM', { locale: sv })}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <Calendar
                  mode="single"
                  selected={(showCalendarToggle ? hasDateSelected : showInCalendar) ? date : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setHasDateSelected(true);
                      if (!showCalendarToggle) setShowInCalendar(true);
                    } else {
                      setHasDateSelected(false);
                      setShowInCalendar(false);
                      setTime(undefined);
                      setEndTime(undefined);
                      endTimeManuallySet.current = false;
                    }
                  }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Start time — shown after a date is selected */}
            {(showCalendarToggle ? hasDateSelected : showInCalendar) && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-7 px-2 rounded-full bg-white/30 flex items-center gap-1 text-xs transition-all active:scale-95 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {time ? (
                      <>
                        <span>{time}</span>
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setTime(undefined); setEndTime(undefined); endTimeManuallySet.current = false; }}
                          className="w-3 h-3 rounded-full hover:bg-white/30 flex items-center justify-center"
                        >
                          <X className="w-2 h-2" />
                        </span>
                      </>
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                  <input
                    type="time"
                    value={time || ''}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm border-0 outline-none"
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* End time — shown after start time is set */}
            {(showCalendarToggle ? hasDateSelected : showInCalendar) && time && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-7 px-2 rounded-full bg-white/30 flex items-center gap-1 text-xs transition-all active:scale-95 whitespace-nowrap">
                    {endTime ? (
                      <>
                        <span>{endTime}</span>
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setEndTime(undefined); endTimeManuallySet.current = true; }}
                          className="w-3 h-3 rounded-full hover:bg-white/30 flex items-center justify-center"
                        >
                          <X className="w-2 h-2" />
                        </span>
                      </>
                    ) : (
                      <span className="opacity-60">End</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 z-[9999]" align="start">
                  <input
                    type="time"
                    value={endTime || ''}
                    onChange={(e) => { setEndTime(e.target.value); endTimeManuallySet.current = true; }}
                    className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm border-0 outline-none"
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Delete — far right of this row */}
            {note && (
              <button
                onClick={handleDelete}
                className="ml-auto p-1.5 rounded-lg bg-white/20 text-destructive transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      <FolderPickerSheet
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        selectedFolder={folder}
        onSelectFolder={(f) => {
          setFolder(f || '');
          setShowFolderPicker(false);
        }}
      />
    </>
  );
}