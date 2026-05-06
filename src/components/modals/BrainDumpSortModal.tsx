import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, FileText, Pin } from 'lucide-react';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type BrainDumpSortType = 'task' | 'event' | 'note' | 'sticky';

const TYPE_META: Record<BrainDumpSortType, { label: string; icon: React.ElementType }> = {
  task:   { label: 'Task',   icon: CheckSquare },
  event:  { label: 'Event',  icon: Calendar },
  note:   { label: 'Note',   icon: FileText },
  sticky: { label: 'Sticky', icon: Pin },
};

interface BrainDumpSortModalProps {
  isOpen: boolean;
  text: string;
  type: BrainDumpSortType;
  onClose: () => void;
  onSorted: () => void;
}

export function BrainDumpSortModal({ isOpen, text, type, onClose, onSorted }: BrainDumpSortModalProps) {
  const { modalTop, maxHeight } = useVisualViewport(70);
  const { addTask, addEvent, addNote, taskCategories, eventCategories } = useAppStore();
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (isOpen) setEditedText(text);
  }, [isOpen, text]);

  const handleCreate = () => {
    const content = editedText.trim();
    if (!content) return;

    switch (type) {
      case 'task': {
        const cat = taskCategories[0];
        addTask({
          title: content,
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
          title: content,
          date: new Date(),
          category: cat?.name || 'Personal',
          color: cat?.color || 'sky',
          isAllDay: true,
        });
        break;
      }
      case 'note': {
        const htmlContent = content.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
        addNote({ title: '', content: htmlContent, type: 'note', tags: [], isPinned: false });
        break;
      }
      case 'sticky':
        addNote({ title: content.slice(0, 40), content, type: 'sticky', tags: [], isPinned: false });
        break;
    }

    toast.success(`${TYPE_META[type].label} created`);
    onSorted();
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
          <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="flow-modal-title">Save as {label}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-foreground/70" />
            </button>
          </div>

          <div className="px-5 pb-5 flex flex-col gap-3 flex-shrink-0">
            <textarea
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              className="w-full min-h-[96px] p-3 bg-secondary border-0 rounded-xl resize-none flow-input text-sm"
              placeholder="Content…"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!editedText.trim()}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
            >
              Create {label}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
