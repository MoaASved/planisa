import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Plus, Calendar, Clock, Tag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarEvent, PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';

interface EditEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditEventModal({ event, isOpen, onClose }: EditEventModalProps) {
  const { updateEvent, eventCategories, addEventCategory } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<PastelColor>('sky');
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState('');

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<PastelColor>('sky');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDate(format(new Date(event.date), 'yyyy-MM-dd'));
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setCategory(event.category);
      setColor(event.color);
      setIsAllDay(event.isAllDay);
      setDescription(event.description || '');
    }
  }, [event]);

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      addEventCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setCategory(newCategoryName.trim());
      setColor(newCategoryColor);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleSave = () => {
    if (!event || !title.trim() || !date) return;

    updateEvent(event.id, {
      title: title.trim(),
      date: new Date(date),
      startTime: isAllDay ? undefined : startTime || undefined,
      endTime: isAllDay ? undefined : endTime || undefined,
      category,
      color,
      isAllDay,
      description: description.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!event) return;
    deleteWithUndo('event', event);
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">Edit Event</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
          />

          <div className="bg-secondary rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2 flex-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm font-medium text-foreground [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
          />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">All Day</span>
                <button onClick={() => setIsAllDay(!isAllDay)}>
                  <div className={cn('w-11 h-6 rounded-full transition-all duration-300 relative', isAllDay ? 'bg-primary' : 'bg-muted')}>
                    <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300', isAllDay ? 'left-5' : 'left-0.5')} />
                  </div>
                </button>
              </div>
            </div>

            {!isAllDay && (
          <div className="flex items-center gap-3 px-3 pb-3 border-t border-border/20 pt-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-transparent border-0 outline-none text-sm font-medium text-foreground [&::-webkit-calendar-picker-indicator]:hidden" />
                <span className="text-muted-foreground text-xs">–</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-transparent border-0 outline-none text-sm font-medium text-foreground [&::-webkit-calendar-picker-indicator]:hidden" />
              </div>
            </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {eventCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.name); setColor(cat.color); }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    category === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full', `bg-pastel-${cat.color}`)} />
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => setShowNewCategory(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-primary hover:bg-muted transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            </div>

            {showNewCategory && (
              <div className="mt-3 p-3 bg-secondary rounded-xl space-y-3 animate-fade-in">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flow-input"
                />
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewCategoryColor(c.value)}
                      className={cn('w-7 h-7 rounded-full transition-all', c.class, newCategoryColor === c.value && 'ring-2 ring-offset-2 ring-primary')}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCategory(false)} className="flex-1 px-3 py-2 rounded-xl text-sm bg-muted text-muted-foreground">Cancel</button>
                  <button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="flex-1 px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground disabled:opacity-50">Add</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color (override)</label>
            <div className="flex flex-wrap gap-2">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn('w-8 h-8 rounded-full transition-all', c.class, color === c.value && 'ring-2 ring-offset-2 ring-primary')}
                />
              ))}
            </div>
          </div>

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

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 space-y-2">
          <button
            onClick={handleSave}
            disabled={!title.trim() || !date}
            className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );
}