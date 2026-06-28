import { useState, useEffect, useRef, useCallback } from 'react';
import { EmojiPicker, useEmojiPicker } from '@/components/ui/EmojiPicker';
import { format } from 'date-fns';
import { X, Plus, Calendar, Clock, Tag, Trash2, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { CalendarEvent, PastelColor, ChecklistItem } from '@/types';
import { pastelColors } from '@/lib/colors';
import { useUndoableDelete } from '@/hooks/useUndoableDelete';
import { useAutoSave } from '@/hooks/useAutoSave';

interface EditEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate?: () => void;
}

export function EditEventModal({ event, isOpen, onClose, onDuplicate }: EditEventModalProps) {
  const { updateEvent, eventCategories, addEventCategory } = useAppStore();
  const { deleteWithUndo } = useUndoableDelete();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<PastelColor | undefined>(undefined);
  const [isAllDay, setIsAllDay] = useState(false);
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState('');

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<PastelColor>('peony');

  const endTimeManuallySet = useRef(false);
  const endDateAutoAdvanced = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const titlePicker = useEmojiPicker(titleRef, title, (v) => { setTitle(v); triggerAutoSave(); });
  const descPicker = useEmojiPicker(descRef, description, (v) => { setDescription(v); triggerAutoSave(); });

  const calculateEndTime = (start: string): string => {
    const [h, m] = start.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    const endMin = h + 1 > 23 ? 59 : m;
    return `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (event) {
      const dateStr = format(new Date(event.date), 'yyyy-MM-dd');
      setTitle(event.title);
      setDate(dateStr);
      setEndDate(event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : dateStr);
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setCategory(event.category);
      setColor(event.color);
      setIsAllDay(event.isAllDay);
      setDescription(event.description || '');
      setChecklist(event.checklist || []);
      setChecklistInput('');
      endTimeManuallySet.current = false;
      endDateAutoAdvanced.current = false;
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

  const { trigger: triggerAutoSave, flush: flushAutoSave, cancel: cancelAutoSave } = useAutoSave(useCallback(() => {
    if (!event || !title.trim() || !date) return;
    updateEvent(event.id, {
      title: title.trim(),
      date: new Date(date),
      endDate: (endDate && endDate !== date) ? new Date(endDate + 'T00:00:00') : undefined,
      startTime: isAllDay ? undefined : startTime || undefined,
      endTime: isAllDay ? undefined : endTime || undefined,
      category,
      color,
      isAllDay,
      description: description.trim() || undefined,
      checklist,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, title, date, endDate, startTime, endTime, isAllDay, category, color, description, checklist]));

  const handleStartDateChange = (newDate: string) => {
    setDate(newDate);
    if (!endDate || endDate < newDate) setEndDate(newDate);
    triggerAutoSave();
  };

  const handleEndTimeChange = (newEndTime: string) => {
    endTimeManuallySet.current = true;
    setEndTime(newEndTime);
    if (date && startTime && newEndTime && newEndTime < startTime) {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setEndDate(format(d, 'yyyy-MM-dd'));
      endDateAutoAdvanced.current = true;
    } else if (endDateAutoAdvanced.current && date) {
      setEndDate(date);
      endDateAutoAdvanced.current = false;
    }
    triggerAutoSave();
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), text: checklistInput.trim(), completed: false }]);
    setChecklistInput('');
    triggerAutoSave();
  };

  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    setChecklist(updated);
    if (event) updateEvent(event.id, { checklist: updated });
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
    triggerAutoSave();
  };

  const handleClose = () => {
    flushAutoSave();
    onClose();
  };

  const handleSave = () => {
    cancelAutoSave();
    if (!event || !title.trim() || !date) return;

    updateEvent(event.id, {
      title: title.trim(),
      date: new Date(date),
      endDate: (endDate && endDate !== date) ? new Date(endDate + 'T00:00:00') : undefined,
      startTime: isAllDay ? undefined : startTime || undefined,
      endTime: isAllDay ? undefined : endTime || undefined,
      category,
      color,
      isAllDay,
      description: description.trim() || undefined,
      checklist,
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
    <div className="fixed inset-0 z-[1100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up safe-bottom">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">Edit Event</h2>
          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button onClick={onDuplicate} className="p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="Duplicate event">
                <Copy className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
            placeholder="Event title"
            className="w-full text-lg font-medium bg-transparent border-0 outline-none placeholder:text-muted-foreground"
          />

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
                    <input
                      type="date"
                      value={endDate}
                      min={date}
                      onChange={e => { setEndDate(e.target.value); triggerAutoSave(); }}
                      className="text-sm font-medium text-foreground bg-transparent border-none outline-none flex-shrink-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => { setEndDate(date); triggerAutoSave(); }}
                      className="w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nextDay = new Date(date);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setEndDate(format(nextDay, 'yyyy-MM-dd'));
                      triggerAutoSave();
                    }}
                    className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  >
                    + end
                  </button>
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

          {!isAllDay && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (!endTimeManuallySet.current && e.target.value) {
                    setEndTime(calculateEndTime(e.target.value));
                  }
                  triggerAutoSave();
                }}
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
                    category === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-white dark:bg-white/[0.06] text-muted-foreground border-border/40 hover:border-border/70'
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
              {/* None / off-white option — last */}
              <button
                onClick={() => setColor('none')}
                className={cn('w-8 h-8 rounded-full transition-all', color === 'none' && 'ring-2 ring-offset-2 ring-primary')}
                style={{ background: '#faf8f4', border: '1px solid #d8d4ce' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Description</label>
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => { setDescription(e.target.value); triggerAutoSave(); }}
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
      <EmojiPicker {...titlePicker} />
      <EmojiPicker {...descPicker} />
    </div>
  );
}