import { useState, useEffect } from 'react';
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
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDate(note.date ? new Date(note.date) : new Date());
      setIsAllDay(true);
      setTime('09:00');
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSave = () => {
    const updatedDate = new Date(date);
    if (!isAllDay) {
      const [hours, minutes] = time.split(':').map(Number);
      updatedDate.setHours(hours, minutes);
    }
    
    updateNote(note.id, {
      title: title.trim() || 'Untitled',
      date: updatedDate,
    });
    onClose();
  };

  const handleOpenNote = () => {
    onClose();
    onOpenFullEditor(note);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in" 
        onClick={onClose} 
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-card rounded-3xl p-6 max-w-md mx-auto animate-scale-in shadow-elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Note Preview</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flow-input"
            placeholder="Note title"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flow-input flex items-center gap-2 text-left">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {format(date, 'EEEE, MMMM d, yyyy')}
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
        </div>

        {/* Time */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Time</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAllDay(true)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isAllDay ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              All day
            </button>
            <button
              onClick={() => setIsAllDay(false)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors',
                !isAllDay ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              Specific time
            </button>
          </div>
          
          {!isAllDay && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flow-input flex-1"
              />
            </div>
          )}
        </div>

        {/* Open Note Button */}
        <button
          onClick={handleOpenNote}
          className="w-full flow-button-secondary flex items-center justify-center gap-2 mb-3"
        >
          <FileText className="w-4 h-4" />
          Open Note
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flow-button-primary"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
