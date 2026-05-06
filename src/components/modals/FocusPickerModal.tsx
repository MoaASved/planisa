import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Calendar, CheckSquare, FileText, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useVisualViewport } from '@/hooks/useVisualViewport';

type ItemType = 'task' | 'event' | 'note' | 'sticky';

export interface FocusCandidate {
  id: string;
  item_id: string;
  item_type: ItemType;
  title: string;
}

interface FocusPickerModalProps {
  isOpen: boolean;
  userId: string;
  currentCount: number;
  onClose: () => void;
  onConfirm: (items: FocusCandidate[]) => void;
}

const TAB_LABELS: { key: ItemType; label: string; icon: React.ElementType }[] = [
  { key: 'task',   label: 'Tasks',    icon: CheckSquare },
  { key: 'event',  label: 'Events',   icon: Calendar },
  { key: 'note',   label: 'Notes',    icon: FileText },
  { key: 'sticky', label: 'Stickies', icon: Pin },
];

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

export function FocusPickerModal({ isOpen, userId, currentCount, onClose, onConfirm }: FocusPickerModalProps) {
  const { modalTop, maxHeight } = useVisualViewport(70);
  const [activeTab, setActiveTab] = useState<ItemType>('task');
  const [items, setItems] = useState<FocusCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FocusCandidate[]>([]);

  const remaining = 3 - currentCount - selected.length;

  useEffect(() => {
    if (!isOpen) { setSelected([]); setActiveTab('task'); return; }
    fetchTab('task');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchTab(activeTab);
  }, [activeTab]);

  const fetchTab = async (tab: ItemType) => {
    setLoading(true);
    setItems([]);
    try {
      if (tab === 'task') {
        const { data } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('user_id', userId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(40);
        setItems((data ?? []).map(r => ({ id: r.id, item_id: r.id, item_type: 'task', title: r.title || 'Untitled' })));

      } else if (tab === 'event') {
        const { data } = await supabase
          .from('events')
          .select('id, title')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(40);
        setItems((data ?? []).map(r => ({ id: r.id, item_id: r.id, item_type: 'event', title: r.title || 'Untitled' })));

      } else if (tab === 'note') {
        const { data } = await supabase
          .from('notes')
          .select('id, title, content')
          .eq('user_id', userId)
          .eq('is_sticky', false)
          .order('updated_at', { ascending: false })
          .limit(40);
        setItems((data ?? []).map(r => ({
          id: r.id,
          item_id: r.id,
          item_type: 'note',
          title: r.title && r.title !== 'Untitled' ? r.title : (r.content ? stripHtml(r.content).slice(0, 60) : 'Untitled'),
        })));

      } else {
        const { data } = await supabase
          .from('notes')
          .select('id, title, content')
          .eq('user_id', userId)
          .eq('is_sticky', true)
          .order('updated_at', { ascending: false })
          .limit(40);
        setItems((data ?? []).map(r => ({
          id: r.id,
          item_id: r.id,
          item_type: 'sticky',
          title: r.title && r.title !== 'Untitled' ? r.title : (r.content ? stripHtml(r.content).slice(0, 60) : 'Untitled note'),
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggle = (item: FocusCandidate) => {
    setSelected(prev => {
      const already = prev.some(s => s.item_id === item.item_id && s.item_type === item.item_type);
      if (already) return prev.filter(s => !(s.item_id === item.item_id && s.item_type === item.item_type));
      if (prev.length >= remaining) return prev; // cap
      return [...prev, item];
    });
  };

  const isSelected = (item: FocusCandidate) =>
    selected.some(s => s.item_id === item.item_id && s.item_type === item.item_type);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        style={{ position: 'fixed', top: modalTop, left: 0, right: 0, zIndex: 9999, padding: '0 20px' }}
      >
        <div
          className="bg-card rounded-3xl shadow-xl overflow-hidden flex flex-col"
          style={{ maxHeight: maxHeight - 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
            <div>
              <h2 className="flow-modal-title">Add Focus Item</h2>
              <p className="flow-meta mt-0.5">{remaining} slot{remaining !== 1 ? 's' : ''} remaining</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-foreground/70" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 px-5 pb-3 flex-shrink-0">
            {TAB_LABELS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors',
                  activeTab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Item list */}
          <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-2">
            {loading && (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No items found</div>
            )}
            {!loading && items.map(item => {
              const sel = isSelected(item);
              const disabled = !sel && remaining === 0;
              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && toggle(item)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors',
                    sel ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/60 hover:bg-secondary',
                    disabled && 'opacity-40'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    sel ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                  )}>
                    {sel && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-2 flex-shrink-0 border-t border-border/40">
            <button
              onClick={() => { if (selected.length > 0) onConfirm(selected); }}
              disabled={selected.length === 0}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              Add {selected.length > 0 ? `${selected.length} item${selected.length > 1 ? 's' : ''}` : 'items'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
