import { format } from 'date-fns';
import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note, PastelColor } from '@/types';
import { getStickyTextClass } from '@/lib/colors';
import { NoteContentPreview } from './NoteContentPreview';

interface StickyNoteCardProps {
  note: Note;
  onClick: () => void;
  isGrid?: boolean;
}

const getStickyBgClass = (color?: PastelColor): string => {
  if (!color) return 'bg-pastel-sky';
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    none: 'bg-pastel-none',
  };
  return colorMap[color] || 'bg-pastel-sky';
};


export function StickyNoteCard({ note, onClick, isGrid = true }: StickyNoteCardProps) {
  const hasContent = note.content && note.content.replace(/<[^>]*>/g, '').trim().length > 0;

  // Deterministic subtle rotation between -1deg and +1deg based on note id.
  // Capped at ±1° so the card corners never extend far enough to overlap
  // adjacent cards (a 360px-wide card at 1° extends ~3px vertically per side).
  const rotation = (() => {
    let hash = 0;
    for (let i = 0; i < note.id.length; i++) {
      hash = (hash * 31 + note.id.charCodeAt(i)) | 0;
    }
    return (((hash % 200) + 200) % 200) / 100 - 1;
  })();

  return (
    <button
      onClick={onClick}
      style={{
        transform: `rotate(${rotation.toFixed(2)}deg)`,
        boxShadow: '2px 3px 8px rgba(0,0,0,0.08)',
      }}
      className={cn(
        'sticky-note-card text-left group transition-all duration-200 w-full rounded-2xl p-4 relative overflow-hidden',
        getStickyBgClass(note.color),
        isGrid ? 'h-[120px] md:h-44 overflow-hidden' : 'min-h-[80px]',
        'hover:scale-[1.02] active:scale-[0.98]'
      )}
    >
      {/* Folded corner effect */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/30 to-transparent rounded-bl-xl" />
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-black/5" />
      
      <div className={cn('flex', isGrid ? 'flex-col h-full' : 'items-start justify-between')}>
        <div className={cn('flex-1 min-w-0 min-h-0 overflow-hidden relative', getStickyTextClass(note.color))}>
          <div className="flex items-start gap-2">
            <div className={cn('flex-1 min-w-0 overflow-hidden', !isGrid && 'max-h-[2.8rem]')}>
              {hasContent ? (
                <NoteContentPreview content={note.content} />
              ) : (
                <p className="text-sm font-medium">{note.title || 'Empty note'}</p>
              )}
            </div>
            {note.isPinned && (
              <Pin className={cn('w-4 h-4 flex-shrink-0 mt-0.5', getStickyTextClass(note.color))} />
            )}
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent, hsl(var(--pastel-${note.color || 'sky'})))` }}
          />
        </div>
        
        <div className={cn(
          'flex-shrink-0 flex items-center gap-2 flex-wrap',
          isGrid ? 'mt-auto pt-3' : 'mt-2'
        )}>
          <span className="text-xs text-[#2C2C2A]/70">
            {format(new Date(note.updatedAt), 'MMM d')}
          </span>
        </div>
      </div>
    </button>
  );
}