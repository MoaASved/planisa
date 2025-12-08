import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const { addEvent, categories } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Work');
  const [color, setColor] = useState<PastelColor>(categories[0]?.color || 'sky');
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !date) return;

    addEvent({
      title: title.trim(),
      date: new Date(date),
      startTime: isAllDay ? undefined : startTime || undefined,
      endTime: isAllDay ? undefined : endTime || undefined,
      category,
      color,
      isAllDay,
      description: description.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setCategory(categories[0]?.name || 'Work');
    setColor(categories[0]?.color || 'sky');
    setIsAllDay(false);
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">New Event</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
            autoFocus
          />

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flow-input"
            />
          </div>

          {/* All Day Toggle */}
          <button
            onClick={() => setIsAllDay(!isAllDay)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-secondary"
          >
            <span className="font-medium text-foreground">All Day</span>
            <div className={cn('w-12 h-7 rounded-full transition-all duration-300 relative', isAllDay ? 'bg-primary' : 'bg-muted')}>
              <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300', isAllDay ? 'left-6' : 'left-1')} />
            </div>
          </button>

          {/* Time */}
          {!isAllDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Start
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flow-input"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> End
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flow-input"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.name); setColor(cat.color); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    category === cat.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    c.class,
                    color === c.value && 'ring-2 ring-offset-2 ring-primary'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={3}
              className="flow-input resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !date}
            className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}