import { useState } from 'react';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { EventColor } from '@/types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['Work', 'Personal', 'Health', 'Social', 'Other'];
const colors: { value: EventColor; label: string; class: string }[] = [
  { value: 'primary', label: 'Default', class: 'bg-primary' },
  { value: 'coral', label: 'Coral', class: 'bg-flow-coral' },
  { value: 'mint', label: 'Mint', class: 'bg-flow-mint' },
  { value: 'lavender', label: 'Lavender', class: 'bg-flow-lavender' },
  { value: 'amber', label: 'Amber', class: 'bg-flow-amber' },
  { value: 'rose', label: 'Rose', class: 'bg-flow-rose' },
];

export function CreateEventModal({ isOpen, onClose }: CreateEventModalProps) {
  const { addEvent } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState<EventColor>('primary');
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
      description: description || undefined,
      isAllDay,
    });

    // Reset form
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setIsAllDay(false);
    setCategory('Personal');
    setColor('primary');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New Event</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm"
              required
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
            <span className="text-sm font-medium">All Day</span>
            <button
              onClick={() => setIsAllDay(!isAllDay)}
              className={cn(
                'w-12 h-7 rounded-full transition-all duration-300 relative',
                isAllDay ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300',
                isAllDay ? 'left-6' : 'left-1'
              )} />
            </button>
          </div>

          {/* Time */}
          {!isAllDay && (
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm"
                  placeholder="Start"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm"
                  placeholder="End"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color Label</label>
            <div className="flex gap-3 mt-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-200',
                    c.class,
                    color === c.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
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
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm outline-none resize-none"
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