import { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, Clock, Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor, ChecklistItem } from '@/types';
import { pastelColors } from '@/lib/colors';
import { format, parseISO } from 'date-fns';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialTime?: string;
  initialTitle?: string;
}

export function CreateEventModal({ isOpen, onClose, initialDate, initialTime, initialTitle }: CreateEventModalProps) {
  const { addEvent, eventCategories, addEventCategory } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState(eventCategories[0]?.name || 'Meetings');
  const [color, setColor] = useState<PastelColor | undefined>(undefined);
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState('');
  const endTimeManuallySet = useRef(false);

  // New category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<PastelColor>('peony');

  // Set initial date/time when modal opens
  useEffect(() => {
    if (isOpen) {
      endTimeManuallySet.current = false;
      setTitle(initialTitle ?? '');
      setDescription('');
      setChecklist([]);
      setChecklistInput('');
      setIsAllDay(false);
      const initDateStr = initialDate ? format(initialDate, 'yyyy-MM-dd') : '';
      setDate(initDateStr);
      setEndDate(initDateStr);
      if (initialTime) {
        handleStartTimeChange(initialTime);
      } else {
        setStartTime('');
        setEndTime('');
      }
    }
  }, [isOpen, initialDate, initialTime]);

  // Auto-calculate end time when start time changes
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    if (!endTimeManuallySet.current && newStartTime) {
      const [h, m] = newStartTime.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      const endM = h >= 23 ? 59 : m;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  const handleStartDateChange = (newDate: string) => {
    setDate(newDate);
    // Keep end date at or after start date
    if (!endDate || endDate < newDate) setEndDate(newDate);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    endTimeManuallySet.current = true;
    setEndTime(newEndTime);
    // Auto-advance end date to next day when end time wraps past midnight
    if (date && startTime && newEndTime && newEndTime < startTime) {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setEndDate(format(d, 'yyyy-MM-dd'));
    }
  };


  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), text: checklistInput.trim(), completed: false }]);
    setChecklistInput('');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      addEventCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setCategory(newCategoryName.trim());
      setColor(newCategoryColor);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !date) return;

    addEvent({
      title: title.trim(),
      date: new Date(date),
      endDate: (endDate && endDate !== date) ? new Date(endDate + 'T00:00:00') : undefined,
      startTime: isAllDay ? undefined : startTime || undefined,
      endTime: isAllDay ? undefined : endTime || undefined,
      category,
      color,
      isAllDay,
      description: description.trim() || undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
    });

    // Reset form
    setTitle('');
    setDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setCategory(eventCategories[0]?.name || 'Meetings');
    setColor(undefined);
    setIsAllDay(false);
    setDescription('');
    setChecklist([]);
    setChecklistInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center">
      <div 
        className="absolute inset-0 glass-overlay animate-fade-in"
        onClick={onClose}
      />
      <div className="relative glass-modal w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
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

          {/* Date + All Day */}
          <div className="bg-secondary rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-transparent border-0 outline-none text-sm font-medium text-foreground min-w-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                />
                {endDate && endDate !== date ? (
                  <>
                    <span className="text-sm text-muted-foreground flex-shrink-0 mx-0.5">—</span>
                    <label className="relative flex-shrink-0 cursor-pointer select-none">
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">
                        {format(parseISO(endDate), 'd MMM')}
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        min={date}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEndDate(date)}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <label className="relative flex items-center justify-center w-5 h-5 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0 cursor-pointer">
                    <input
                      type="date"
                      value={endDate || date}
                      min={date}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <Plus className="w-3.5 h-3.5 pointer-events-none" />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-muted-foreground">All Day</span>
                <button onClick={() => setIsAllDay(!isAllDay)}>
                  <div className={cn('w-11 h-6 rounded-full transition-all duration-300 relative border', isAllDay ? 'bg-primary/20 border-primary/40' : 'bg-muted border-border')}>
                    <div className={cn('absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300', isAllDay ? 'left-5 bg-primary' : 'left-0.5 bg-muted-foreground/40')} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Time */}
          {!isAllDay && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
              />
            </div>
          )}

          {/* Category */}
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
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border',
                    category === cat.name
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white dark:bg-white/[0.06] text-muted-foreground border-border/40 hover:border-border/70'
                  )}
                >
                  <div className={cn('w-3.5 h-3.5 rounded-full', `bg-pastel-${cat.color}`)} />
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

            {/* New Category Inline Form */}
            {showNewCategory && (
              <div className="mt-3 p-3 bg-secondary rounded-xl space-y-3 animate-fade-in">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flow-input"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewCategoryColor(c.value)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        c.class,
                        newCategoryColor === c.value && 'ring-2 ring-offset-2 ring-primary'
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewCategory(false)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-muted text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Color Override */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Color (override)</label>
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
              {/* None / off-white option — last */}
              <button
                onClick={() => setColor('none')}
                className={cn('w-8 h-8 rounded-full transition-all', color === 'none' && 'ring-2 ring-offset-2 ring-primary')}
                style={{ background: '#faf8f4', border: '1px solid #d8d4ce' }}
              />
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

          {/* Checklist */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Checklist</label>
            {checklist.length > 0 && (
              <div className="mb-2 space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-secondary">
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                        item.completed ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                      )}
                    >
                      {item.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </button>
                    <span className={cn('flex-1 text-sm', item.completed && 'line-through text-muted-foreground')}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                placeholder="Add item..."
                className="flex-1 flow-input"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                disabled={!checklistInput.trim()}
                className="px-3 py-2 rounded-xl bg-secondary text-primary text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
