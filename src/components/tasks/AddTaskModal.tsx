import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { X, Calendar as CalendarIcon, Star, Plus, Trash2, ListChecks, Check, Clock, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Task, Subtask } from '@/types';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getColorDotClass, getAccentDotClass } from '@/lib/colors';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListId?: string;
  editingTaskId?: string;
  defaultDate?: Date;
  defaultTime?: string;
  onOpenInList?: () => void;
}

export function AddTaskModal({ isOpen, onClose, defaultListId, editingTaskId, defaultDate, defaultTime, onOpenInList }: AddTaskModalProps) {
  const { addTask, updateTask, deleteTask, toggleSubtask, taskCategories, tasks } = useAppStore();
  const editing = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : undefined;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState(false);
  const [listId, setListId] = useState<string>('');
  const [subs, setSubs] = useState<Subtask[]>([]);
  const [newSub, setNewSub] = useState('');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [listPopoverOpen, setListPopoverOpen] = useState(false);
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [timeShortcutPopoverOpen, setTimeShortcutPopoverOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const endTimeManual = useRef(false);

  const addMinutes = (t: string, mins: number): string => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const total = h * 60 + m + mins;
    const nh = Math.min(Math.floor(total / 60), 23);
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setTitle(editing.title);
      setNote(editing.note ?? '');
      setShowNote(!!editing.note);
      setDate(editing.date ? new Date(editing.date).toISOString().slice(0, 10) : '');
      setTime(editing.time ?? '');
      setEndTime(editing.endTime ?? '');
      endTimeManual.current = !!editing.endTime;
      setShowTimeFields(!!editing.time);
      setPriority(editing.priority !== 'none');
      const cat = taskCategories.find((c) => c.name === editing.category);
      setListId(cat?.id ?? '');
      setSubs(editing.subtasks);
    } else {
      setTitle('');
      setNote('');
      setShowNote(false);
      setDate('');
      if (defaultTime) {
        setTime(defaultTime);
        setEndTime(addMinutes(defaultTime, 30));
        setShowTimeFields(true);
      } else {
        setTime('');
        setEndTime('');
        setShowTimeFields(false);
      }
      endTimeManual.current = false;
      setPriority(false);
      setListId(defaultListId ?? taskCategories[0]?.id ?? '');
      setSubs([]);
    }
    setNewSub('');
    setDatePopoverOpen(false);
    setListPopoverOpen(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTaskId, defaultListId]);

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (!newTime) {
      setEndTime('');
      endTimeManual.current = false;
      return;
    }
    if (!endTimeManual.current || !endTime) {
      setEndTime(addMinutes(newTime, 30));
    }
  };

  const handleEndTimeChange = (v: string) => {
    endTimeManual.current = true;
    setEndTime(v);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const cat = taskCategories.find((c) => c.id === listId);
    const payload: Omit<Task, 'id' | 'createdAt'> = {
      title: trimmed,
      completed: editing?.completed ?? false,
      note: note.trim() || undefined,
      date: date ? new Date(date) : undefined,
      time: time || undefined,
      endTime: time ? (endTime || addMinutes(time, 30)) : undefined,
      category: cat?.name ?? '',
      color: cat?.color ?? 'gray',
      subtasks: subs,
      priority: priority ? 'high' : 'none',
      listId: cat?.id,
    };
    if (editing) {
      updateTask(editing.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubs([...subs, { id: `s-${Date.now()}`, title: t, completed: false }]);
    setNewSub('');
    setTimeout(() => subInputRef.current?.focus(), 30);
  };

  const selectedList = taskCategories.find((c) => c.id === listId);
  const dateLabel = (() => {
    if (!date) return null;
    const d = new Date(date + 'T00:00:00');
    const base = format(d, 'MMM d');
    if (time) {
      return `${base} · ${time}${endTime ? `–${endTime}` : ''}`;
    }
    return base;
  })();

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[6px] animate-fade-in"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 flex items-center justify-center px-4 py-6 overflow-y-auto"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-sm bg-card rounded-3xl shadow-2xl animate-spring-pop my-auto"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-2 space-y-2.5 max-h-[65vh] overflow-y-auto">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full bg-transparent border-0 outline-none text-[20px] font-semibold text-foreground placeholder:text-muted-foreground/50"
            />

            {/* Note */}
            {showNote ? (
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => !note.trim() && setShowNote(false)}
                placeholder="Note"
                rows={2}
                autoFocus
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 resize-none animate-fade-in"
              />
            ) : (
              <button
                onClick={() => {
                  setShowNote(true);
                  setTimeout(() => noteRef.current?.focus(), 30);
                }}
                className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                + Add note
              </button>
            )}

            {/* Subtasks list */}
            {subs.length > 0 && (
              <div className="space-y-1 pt-1">
                {subs.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 group animate-fade-in">
                    <button
                      onClick={() => {
                        if (editingTaskId) {
                          toggleSubtask(editingTaskId, s.id);
                        }
                        setSubs(subs.map((x) => x.id === s.id ? { ...x, completed: !x.completed } : x));
                      }}
                      className={cn(
                        'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all',
                        s.completed
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/40 hover:border-primary',
                      )}
                    >
                      {s.completed && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                        </svg>
                      )}
                    </button>
                    <span className={cn(
                      'flex-1 text-sm',
                      s.completed ? 'line-through text-muted-foreground' : 'text-foreground',
                    )}>{s.title}</span>
                    <button
                      onClick={() => setSubs(subs.filter((x) => x.id !== s.id))}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Subtask input */}
            <div className="flex items-center gap-2 mt-1">
              <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={subInputRef}
                type="text"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSub();
                  }
                }}
                placeholder="Add subtask..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 my-3 h-px bg-border" />

          {/* Icon / pill row */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverAnchor asChild>
              <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                {/* List pill */}
                <Popover open={listPopoverOpen} onOpenChange={setListPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-secondary hover:bg-secondary/70 transition-colors">
                      {selectedList ? (
                        <>
                          <span className={cn('w-2 h-2 rounded-full', getAccentDotClass(selectedList.color))} />
                          <span className="text-xs font-medium text-foreground">{selectedList.name}</span>
                        </>
                      ) : (
                        <>
                          <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">List</span>
                        </>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-56 p-1.5 rounded-2xl"
                    style={{ zIndex: 10000 }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {taskCategories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setListId(c.id);
                            setListPopoverOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-secondary transition-colors"
                        >
                          <span className={cn('w-2.5 h-2.5 rounded-full', getAccentDotClass(c.color))} />
                          <span className="flex-1 text-left text-sm text-foreground">{c.name}</span>
                          {listId === c.id && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Priority */}
                <button
                  onClick={() => setPriority(!priority)}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full transition-colors',
                    priority ? 'bg-amber-500/15' : 'bg-secondary hover:bg-secondary/70',
                  )}
                >
                  <Star
                    className={cn(
                      'w-3.5 h-3.5',
                      priority ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground',
                    )}
                  />
                </button>

                {/* Date pill */}
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1.5 h-8 px-2.5 rounded-full transition-colors',
                      date ? 'bg-primary/10 text-primary' : 'bg-secondary hover:bg-secondary/70',
                    )}
                  >
                    <CalendarIcon className={cn('w-3.5 h-3.5', date ? 'text-primary' : 'text-muted-foreground')} />
                    {dateLabel ? (
                      <>
                        <span className="text-xs font-medium">{dateLabel}</span>
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDate('');
                            setTime('');
                            setEndTime('');
                            endTimeManual.current = false;
                          }}
                          className="ml-0.5 -mr-0.5 w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center"
                        >
                          <X className="w-2.5 h-2.5" />
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">Date</span>
                    )}
                  </button>
                </PopoverTrigger>

                {/* Calendar date shortcut — only shown when opening from calendar and no date is set yet */}
                {defaultDate && !date && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = defaultDate;
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-secondary hover:bg-secondary/70 transition-colors"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {isToday(defaultDate) ? 'Today' : isTomorrow(defaultDate) ? 'Tomorrow' : format(defaultDate, 'MMM d')}
                    </span>
                  </button>
                )}

                {/* Calendar time shortcut — only shown after date shortcut used and no time set yet */}
                {defaultDate && date && !time && (
                  <Popover open={timeShortcutPopoverOpen} onOpenChange={setTimeShortcutPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-secondary hover:bg-secondary/70 transition-colors"
                      >
                        <span className="text-xs font-medium text-muted-foreground">Time</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={8}
                      collisionPadding={16}
                      className="w-auto p-3 rounded-2xl"
                      style={{ zIndex: 10000 }}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => { setShowTimeFields(true); handleTimeChange(e.target.value); }}
                          autoFocus
                          className={cn(
                            'flex-1 h-9 rounded-lg px-2 text-sm text-center bg-secondary/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                            !time && 'text-muted-foreground/60',
                          )}
                        />
                        <span className="text-muted-foreground text-sm">–</span>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => handleEndTimeChange(e.target.value)}
                          className={cn(
                            'flex-1 h-9 rounded-lg px-2 text-sm text-center bg-secondary/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                            !endTime && 'text-muted-foreground/60',
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setTimeShortcutPopoverOpen(false)}
                          className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center text-muted-foreground transition-colors shrink-0"
                          aria-label="Done"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </PopoverAnchor>
            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              className="w-auto p-3 rounded-2xl"
              style={{ zIndex: 10000 }}
            >
              {/* Time: on-demand */}
              {!showTimeFields ? (
                <button
                  onClick={() => setShowTimeFields(true)}
                  className="w-full mb-3 h-9 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors flex items-center justify-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Add time</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 mb-3 animate-fade-in">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    autoFocus
                    className={cn(
                      'flex-1 h-9 rounded-lg px-2 text-sm text-center bg-secondary/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                      !time && 'text-muted-foreground/60',
                    )}
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className={cn(
                      'flex-1 h-9 rounded-lg px-2 text-sm text-center bg-secondary/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                      !endTime && 'text-muted-foreground/60',
                    )}
                  />
                  <button
                    onClick={() => {
                      setTime('');
                      setEndTime('');
                      endTimeManual.current = false;
                      setShowTimeFields(false);
                    }}
                    className="w-7 h-7 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors shrink-0"
                    aria-label="Clear time"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Calendar */}
              <Calendar
                mode="single"
                weekStartsOn={1}
                selected={date ? new Date(date + 'T00:00:00') : undefined}
                onSelect={(d) => {
                  if (!d) {
                    setDate('');
                    return;
                  }
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  setDate(`${yyyy}-${mm}-${dd}`);
                }}
                className={cn('p-0 pointer-events-auto')}
              />

              {date && (
                <button
                  onClick={() => {
                    setDate('');
                    setTime('');
                    setEndTime('');
                    endTimeManual.current = false;
                    setShowTimeFields(false);
                    setDatePopoverOpen(false);
                  }}
                  className="w-full mt-2 py-2 text-xs font-medium text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                >
                  Clear date
                </button>
              )}
            </PopoverContent>
          </Popover>

          {/* Footer actions */}
          <div className="px-5 pb-5 pt-1 flex items-center gap-2">
            {editing && (
              <button
                onClick={() => {
                  deleteTask(editing.id);
                  onClose();
                }}
                className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {editing && onOpenInList && (
              <button
                onClick={() => {
                  handleSave();
                  onOpenInList();
                }}
                className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground text-sm font-medium transition-colors shrink-0"
              >
                <ListTodo className="w-4 h-4" />
                Open in list
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-40 transition-opacity"
            >
              {editing ? 'Save' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
