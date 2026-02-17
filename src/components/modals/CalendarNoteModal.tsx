import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Note } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface CalendarNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEditor: (note: Note) => void;
}

export function CalendarNoteModal({ note, isOpen, onClose, onOpenFullEditor }: CalendarNoteModalProps) {
  const { updateNote } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(true);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const endTimeManuallySet = useRef(false);

  const calculateEndTime = (start: string): string => {
    const [h, m] = start.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const endMin = h + 1 > 23 ? 59 : m;
    return `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDate(note.date ? new Date(note.date) : new Date());
      setTime(note.time);
      setEndTime(note.endTime);
      setIsAllDay(!note.time);
      endTimeManuallySet.current = false;
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSave = () => {
    updateNote(note.id, {
      title: title.trim() || 'Untitled',
      date,
      time: isAllDay ? undefined : time,
      endTime: isAllDay ? undefined : endTime,
    });
    onClose();
  };

  const handleOpenNote = () => {
    onClose();
    onOpenFullEditor(note);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[1100] animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Compact Bottom Sheet Modal */}
      <div className="fixed inset-x-3 z-[1200] bg-card rounded-2xl p-4 max-w-sm mx-auto animate-scale-in shadow-elevated" style={{ bottom: '40%' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Note</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-secondary hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm mb-3 border-0 outline-none text-foreground placeholder:text-muted-foreground"
          placeholder="Note title"
        />

        {/* Date & Time Row */}
        <div className="flex items-center gap-2 mb-3">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground hover:bg-muted transition-colors">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(date, 'MMM d')}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          {/* Time toggle */}
          <button
            onClick={() => {
              if (isAllDay) {
                setIsAllDay(false);
                const defaultTime = '09:00';
                setTime(defaultTime);
                setEndTime(calculateEndTime(defaultTime));
                endTimeManuallySet.current = false;
              } else {
                setIsAllDay(true);
                setTime(undefined);
                setEndTime(undefined);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors",
              isAllDay ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
            )}
          >
            <Clock className="w-4 h-4" />
            {isAllDay ? 'All day' : (time || '09:00')}
          </button>
        </div>

        {/* Time inputs when not all day */}
        {!isAllDay && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="time"
              value={time || '09:00'}
              onChange={(e) => {
                setTime(e.target.value);
                if (!endTimeManuallySet.current && e.target.value) {
                  setEndTime(calculateEndTime(e.target.value));
                }
              }}
              className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="time"
              value={endTime || ''}
              onChange={(e) => {
                endTimeManuallySet.current = true;
                setEndTime(e.target.value || undefined);
              }}
              min={time}
              placeholder="End"
              className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleOpenNote}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Open
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
