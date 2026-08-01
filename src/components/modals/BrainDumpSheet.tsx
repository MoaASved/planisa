import ReactDOM from 'react-dom';
import { useRef, useState } from 'react';
import { X, CheckSquare, Calendar, FileText, Pin, Lock } from 'lucide-react';
import { format, parseISO, type Locale } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getDateFnsLocale } from '@/lib/dateLocale';
import { BrainDumpSortType } from './BrainDumpSortModal';

export interface BrainDumpItem {
  id: string;
  content: string;
  created_at: string;
}

interface BrainDumpSheetProps {
  isOpen: boolean;
  items: BrainDumpItem[];
  onClose: () => void;
  onSort: (item: BrainDumpItem, type: BrainDumpSortType) => void;
  onDelete: (id: string) => void;
  hasFullAccess?: boolean;
}

const SORT_BUTTONS: { type: BrainDumpSortType; icon: React.ElementType; labelKey: 'common.task' | 'common.event' | 'common.note' | 'common.sticky'; requiresAccess: boolean }[] = [
  { type: 'task',   icon: CheckSquare, labelKey: 'common.task',   requiresAccess: true  },
  { type: 'event',  icon: Calendar,    labelKey: 'common.event',  requiresAccess: false },
  { type: 'note',   icon: FileText,    labelKey: 'common.note',   requiresAccess: true  },
  { type: 'sticky', icon: Pin,         labelKey: 'common.sticky', requiresAccess: true  },
];

function fmtDate(ts: string, locale: Locale) {
  try { return format(parseISO(ts), 'MMM d, HH:mm', { locale }); } catch { return ''; }
}

// ─── Swipeable item row ────────────────────────────────────────────────────────

function SwipeableItem({
  item,
  onSort,
  onDelete,
  hasFullAccess = true,
}: {
  item: BrainDumpItem;
  onSort: (type: BrainDumpSortType) => void;
  onDelete: () => void;
  hasFullAccess?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.language);
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(dx);
  };
  const handleTouchEnd = () => {
    dragging.current = false;
    if (offset < -80) {
      setOffset(-500);
      setTimeout(onDelete, 200);
    } else {
      setOffset(0);
    }
  };

  return (
    <div
      style={{
        transform: `translateX(${offset}px)`,
        transition: offset === 0 || offset === -500 ? 'transform 0.2s ease' : 'none',
      }}
      className="bg-secondary/60 rounded-2xl px-4 py-3"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm text-foreground leading-relaxed flex-1">{item.content}</p>
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5"
          aria-label={t('brainDumpSheet.deleteAria')}
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{fmtDate(item.created_at, dateLocale)}</span>
        <div className="flex gap-1.5">
          {SORT_BUTTONS.map(({ type, icon: Icon, labelKey, requiresAccess }) => {
            const locked = requiresAccess && !hasFullAccess;
            return (
              <button
                key={type}
                onClick={() => !locked && onSort(type)}
                disabled={locked}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background text-xs font-medium transition-colors',
                  locked
                    ? 'text-foreground/30 cursor-default'
                    : 'text-foreground/70 hover:bg-primary/10 hover:text-primary'
                )}
              >
                {locked ? <Lock className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sheet ─────────────────────────────────────────────────────────────────────

export function BrainDumpSheet({ isOpen, items, onClose, onSort, onDelete, hasFullAccess = true }: BrainDumpSheetProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, maxHeight: '75dvh' }}
        className="bg-card rounded-t-3xl shadow-xl flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <h2 className="flow-modal-title">{t('brainDumpSheet.title')}</h2>
            <p className="flow-meta mt-0.5">{t('brainDumpSheet.itemCount', { count: items.length })}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-foreground/70" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-2">
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('brainDumpSheet.empty')}</p>
          )}
          {items.map(item => (
            <SwipeableItem
              key={item.id}
              item={item}
              onSort={type => onSort(item, type)}
              onDelete={() => onDelete(item.id)}
              hasFullAccess={hasFullAccess}
            />
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
