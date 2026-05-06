import { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Calendar, CheckSquare, FileText, Pin, Search, PenLine, Plus } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useVisualViewport } from '@/hooks/useVisualViewport';

export type FocusItemType = 'task' | 'event' | 'note' | 'sticky' | 'custom';

export interface FocusCandidate {
  id: string;
  item_id: string;
  item_type: FocusItemType;
  title: string;
  subtitle: string;
}

interface FocusPickerModalProps {
  isOpen: boolean;
  userId: string;
  currentCount: number;
  onClose: () => void;
  onConfirm: (items: FocusCandidate[]) => void;
}

const TAB_LABELS: { key: FocusItemType; label: string; icon: React.ElementType }[] = [
  { key: 'task',   label: 'Tasks',    icon: CheckSquare },
  { key: 'event',  label: 'Events',   icon: Calendar },
  { key: 'note',   label: 'Notes',    icon: FileText },
  { key: 'sticky', label: 'Stickies', icon: Pin },
  { key: 'custom', label: 'Custom',   icon: PenLine },
];

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .trim();
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'MMM d'); } catch { return ''; }
}

function fmtDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  const d = fmtDate(dateStr);
  if (!d) return '';
  return timeStr ? `${d} at ${timeStr}` : d;
}

function fmtUpdated(ts: string | null | undefined): string {
  if (!ts) return '';
  try { return format(parseISO(ts), 'MMM d'); } catch { return ''; }
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function FocusPickerModal({ isOpen, userId, currentCount, onClose, onConfirm }: FocusPickerModalProps) {
  const { modalTop, maxHeight } = useVisualViewport(70);
  const [activeTab, setActiveTab] = useState<FocusItemType>('task');
  const [items, setItems] = useState<FocusCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FocusCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');

  const cap = 3 - currentCount;
  const remaining = cap - selected.length;

  useEffect(() => {
    if (!isOpen) { setSelected([]); setActiveTab('task'); setSearchQuery(''); setCustomText(''); return; }
    fetchTab('task');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab !== 'custom') {
      setSearchQuery('');
      fetchTab(activeTab);
    }
  }, [activeTab]);

  const fetchTab = async (tab: FocusItemType) => {
    if (!userId || tab === 'custom') return;
    setLoading(true);
    setItems([]);
    try {
      if (tab === 'task') {
        const { data } = await supabase
          .from('tasks')
          .select('id, title, due_date, category_name, priority')
          .eq('user_id', userId)
          .eq('completed', false)
          .eq('hidden', false)
          .limit(60);

        const sorted = (data ?? []).sort((a, b) => {
          const pa = PRIORITY_ORDER[a.priority ?? 'none'] ?? 3;
          const pb = PRIORITY_ORDER[b.priority ?? 'none'] ?? 3;
          if (pa !== pb) return pa - pb;
          const aDue = a.due_date ? isToday(parseISO(a.due_date)) : false;
          const bDue = b.due_date ? isToday(parseISO(b.due_date)) : false;
          if (aDue !== bDue) return aDue ? -1 : 1;
          if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;
        });

        setItems(sorted.map(r => {
          const parts: string[] = [];
          if (r.priority && r.priority !== 'none') parts.push(r.priority.charAt(0).toUpperCase() + r.priority.slice(1) + ' priority');
          if (r.due_date) {
            const label = isToday(parseISO(r.due_date)) ? 'Due today' : `Due ${fmtDate(r.due_date)}`;
            parts.push(label);
          }
          if (r.category_name) parts.push(r.category_name);
          return {
            id: r.id, item_id: r.id, item_type: 'task' as FocusItemType,
            title: r.title || 'Untitled',
            subtitle: parts.join(' · '),
          };
        }));

      } else if (tab === 'event') {
        const today = todayStr();
        const { data } = await supabase
          .from('events')
          .select('id, title, event_date, time_text')
          .eq('user_id', userId)
          .eq('event_date', today)
          .order('time_text', { ascending: true, nullsFirst: false })
          .limit(40);

        setItems((data ?? []).map(r => ({
          id: r.id, item_id: r.id, item_type: 'event' as FocusItemType,
          title: r.title || 'Untitled',
          subtitle: r.time_text ? `Today at ${r.time_text}` : 'Today',
        })));

      } else if (tab === 'note') {
        const { data } = await supabase
          .from('notes')
          .select('id, title, content, updated_at, pinned')
          .eq('user_id', userId)
          .eq('is_sticky', false)
          .order('updated_at', { ascending: false })
          .limit(60);

        const sorted = (data ?? []).sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          const aToday = a.updated_at ? isToday(parseISO(a.updated_at)) : false;
          const bToday = b.updated_at ? isToday(parseISO(b.updated_at)) : false;
          if (aToday !== bToday) return aToday ? -1 : 1;
          return 0;
        });

        setItems(sorted.map(r => {
          const plain = r.content ? stripHtml(r.content) : '';
          const firstLine = plain.split('\n').map((l: string) => l.trim()).find((l: string) => l.length > 0) ?? '';
          const titleDisplay = r.title && r.title !== 'Untitled' ? r.title : firstLine.slice(0, 60) || 'Untitled';
          const preview = titleDisplay === firstLine ? '' : firstLine.slice(0, 60);
          const date = fmtUpdated(r.updated_at);
          const parts: string[] = [];
          if (r.pinned) parts.push('Pinned');
          if (preview) parts.push(preview);
          if (date) parts.push(date);
          return { id: r.id, item_id: r.id, item_type: 'note' as FocusItemType, title: titleDisplay, subtitle: parts.join(' · ') };
        }));

      } else {
        const { data } = await supabase
          .from('notes')
          .select('id, title, content, updated_at')
          .eq('user_id', userId)
          .eq('is_sticky', true)
          .order('updated_at', { ascending: false })
          .limit(40);

        const sorted = (data ?? []).sort((a, b) => {
          const aToday = a.updated_at ? isToday(parseISO(a.updated_at)) : false;
          const bToday = b.updated_at ? isToday(parseISO(b.updated_at)) : false;
          if (aToday !== bToday) return aToday ? -1 : 1;
          return 0;
        });

        setItems(sorted.map(r => {
          const plain = r.content ? stripHtml(r.content) : '';
          const firstLine = plain.split('\n').map((l: string) => l.trim()).find((l: string) => l.length > 0) ?? '';
          const titleDisplay = firstLine.slice(0, 60) || r.title || 'Untitled sticky';
          const date = fmtUpdated(r.updated_at);
          return { id: r.id, item_id: r.id, item_type: 'sticky' as FocusItemType, title: titleDisplay, subtitle: date };
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const toggle = (item: FocusCandidate) => {
    setSelected(prev => {
      const already = prev.some(s => s.item_id === item.item_id && s.item_type === item.item_type);
      if (already) {
        const next = prev.filter(s => !(s.item_id === item.item_id && s.item_type === item.item_type));
        console.log('[FocusPicker] deselected', item.title, '— selected:', next.length);
        return next;
      }
      if (prev.length + currentCount >= 3) {
        console.log('[FocusPicker] cap reached, ignoring', item.title);
        return prev;
      }
      const next = [...prev, item];
      console.log('[FocusPicker] selected', item.title, '— selected:', next.length);
      return next;
    });
  };

  const handleAddCustom = () => {
    const text = customText.trim();
    if (!text || remaining <= 0) return;
    const id = crypto.randomUUID();
    const candidate: FocusCandidate = {
      id,
      item_id: id,
      item_type: 'custom',
      title: text,
      subtitle: '',
    };
    setSelected(prev => {
      if (prev.length + currentCount >= 3) return prev;
      return [...prev, candidate];
    });
    setCustomText('');
  };

  const isSelected = (item: FocusCandidate) =>
    selected.some(s => s.item_id === item.item_id && s.item_type === item.item_type);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      <div style={{ position: 'fixed', top: modalTop, left: 0, right: 0, zIndex: 9999, padding: '0 20px' }}>
        <div className="bg-card rounded-3xl shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: maxHeight - 20 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
            <div>
              <h2 className="flow-modal-title">Today's Focus</h2>
              <p className="flow-meta mt-0.5">
                {remaining > 0 ? `${remaining} slot${remaining !== 1 ? 's' : ''} remaining` : 'Selection full'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-foreground/70" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pb-3 flex-shrink-0">
            {TAB_LABELS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-colors',
                  activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search bar — hidden on custom tab */}
          {activeTab !== 'custom' && (
            <div className="px-5 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Custom tab body */}
          {activeTab === 'custom' && (
            <div className="flex-1 px-5 pb-3 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-4">Add a free-text focus item not linked to any task, event, or note.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  placeholder="e.g. Call the doctor"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={!customText.trim() || remaining <= 0}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              {selected.filter(s => s.item_type === 'custom').length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Added</p>
                  {selected.filter(s => s.item_type === 'custom').map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-primary/10 border border-primary/30">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="flex-1 text-sm text-foreground truncate">{item.title}</span>
                      <button onClick={() => toggle(item)} className="w-6 h-6 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List — only shown on non-custom tabs */}
          {activeTab !== 'custom' && (
            <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-2">
              {loading && <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>}
              {!loading && filteredItems.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {activeTab === 'event' ? 'No events today' : searchQuery ? 'No results' : 'No items found'}
                </div>
              )}
              {!loading && filteredItems.map(item => {
                const sel = isSelected(item);
                const disabled = !sel && remaining <= 0;
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

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
