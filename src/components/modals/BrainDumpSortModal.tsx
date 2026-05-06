import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { X, CheckSquare, Calendar, FileText, ChevronDown } from 'lucide-react';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useAppStore } from '@/store/useAppStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export type BrainDumpSortType = 'task' | 'event' | 'note' | 'sticky';

const TYPE_META: Record<Exclude<BrainDumpSortType, 'sticky'>, { label: string; icon: React.ElementType }> = {
  task:  { label: 'Task',  icon: CheckSquare },
  event: { label: 'Event', icon: Calendar },
  note:  { label: 'Note',  icon: FileText },
};

interface BrainDumpSortModalProps {
  isOpen: boolean;
  text: string;
  type: Exclude<BrainDumpSortType, 'sticky'>;
  onClose: () => void;
  onSorted: () => void;
  onOpenFullEditor: (title: string) => void;
}

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─── Field row wrapper ────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground mb-1.5">{children}</p>;
}

function FieldInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border-0"
    />
  );
}

function FieldSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none px-3 py-2.5 pr-8 bg-secondary rounded-xl text-sm text-foreground outline-none border-0 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Type-specific field sets ─────────────────────────────────────────────────

function TaskFields({
  title, setTitle, listId, setListId,
}: {
  title: string; setTitle: (v: string) => void;
  listId: string; setListId: (v: string) => void;
}) {
  const { taskCategories } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  return (
    <>
      <div>
        <FieldLabel>Title</FieldLabel>
        <FieldInput ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
      </div>
      <div>
        <FieldLabel>List</FieldLabel>
        <FieldSelect value={listId} onChange={e => setListId(e.target.value)}>
          {taskCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {taskCategories.length === 0 && <option value="">No lists</option>}
        </FieldSelect>
      </div>
    </>
  );
}

function EventFields({
  title, setTitle, date, setDate, time, setTime,
}: {
  title: string; setTitle: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  return (
    <>
      <div>
        <FieldLabel>Title</FieldLabel>
        <FieldInput ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldLabel>Date</FieldLabel>
          <FieldInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <FieldLabel>Time (optional)</FieldLabel>
          <FieldInput type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
    </>
  );
}

function NoteFields({
  title, setTitle, folder, setFolder,
}: {
  title: string; setTitle: (v: string) => void;
  folder: string; setFolder: (v: string) => void;
}) {
  const { folders } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  return (
    <>
      <div>
        <FieldLabel>Title</FieldLabel>
        <FieldInput ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" />
      </div>
      <div>
        <FieldLabel>Folder (optional)</FieldLabel>
        <FieldSelect value={folder} onChange={e => setFolder(e.target.value)}>
          <option value="">No folder</option>
          {folders.map(f => (
            <option key={f.id} value={f.name}>{f.name}</option>
          ))}
        </FieldSelect>
      </div>
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function BrainDumpSortModal({ isOpen, text, type, onClose, onSorted, onOpenFullEditor }: BrainDumpSortModalProps) {
  const { modalTop, maxHeight } = useVisualViewport(70);
  const { addTask, addEvent, addNote, taskCategories, eventCategories } = useAppStore();

  const [title, setTitle] = useState('');
  const [listId, setListId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [folder, setFolder] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(text);
    setListId(taskCategories[0]?.id ?? '');
    setDate(todayIso());
    setTime('');
    setFolder('');
  }, [isOpen, text]);

  const handleCreate = () => {
    const t = title.trim();
    if (!t) return;

    switch (type) {
      case 'task': {
        const cat = taskCategories.find(c => c.id === listId) ?? taskCategories[0];
        addTask({
          title: t,
          completed: false,
          category: cat?.name || 'Inbox',
          color: cat?.color || 'lavender',
          subtasks: [],
          priority: 'none',
        });
        break;
      }
      case 'event': {
        const cat = eventCategories[0];
        addEvent({
          title: t,
          date: date ? new Date(date + 'T12:00:00') : new Date(),
          category: cat?.name || 'Personal',
          color: cat?.color || 'sky',
          isAllDay: !time,
          startTime: time || undefined,
        });
        break;
      }
      case 'note': {
        const htmlContent = t.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
        addNote({
          title: t,
          content: htmlContent,
          type: 'note',
          tags: [],
          isPinned: false,
          folder: folder || undefined,
        });
        break;
      }
    }

    toast.success(`${TYPE_META[type].label} created`);
    onSorted();
    onClose();
  };

  const handleOpenFull = () => {
    onOpenFullEditor(title.trim() || text);
    onClose();
  };

  if (!isOpen) return null;

  const { label, icon: Icon } = TYPE_META[type];

  return ReactDOM.createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div style={{ position: 'fixed', top: modalTop, left: 0, right: 0, zIndex: 10001, padding: '0 20px' }}>
        <div className="bg-card rounded-3xl shadow-xl flex flex-col" style={{ maxHeight: maxHeight - 20 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="flow-modal-title">New {label}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-foreground/70" />
            </button>
          </div>

          {/* Fields */}
          <div className="px-5 pb-5 flex flex-col gap-3 flex-shrink-0 overflow-y-auto">
            {type === 'task' && (
              <TaskFields title={title} setTitle={setTitle} listId={listId} setListId={setListId} />
            )}
            {type === 'event' && (
              <EventFields title={title} setTitle={setTitle} date={date} setDate={setDate} time={time} setTime={setTime} />
            )}
            {type === 'note' && (
              <NoteFields title={title} setTitle={setTitle} folder={folder} setFolder={setFolder} />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleOpenFull}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                + add details
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
              >
                Save {label}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}
