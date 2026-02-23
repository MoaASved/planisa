import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Note, PastelColor } from '@/types';

interface StickyNoteCardProps {
  note: Note;
  onClick: () => void;
  isGrid?: boolean;
}

const getStickyBgClass = (color?: PastelColor): string => {
  if (!color) return 'bg-pastel-yellow/60';
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral/60',
    peach: 'bg-pastel-peach/60',
    amber: 'bg-pastel-amber/60',
    yellow: 'bg-pastel-yellow/60',
    mint: 'bg-pastel-mint/60',
    teal: 'bg-pastel-teal/60',
    sky: 'bg-pastel-sky/60',
    lavender: 'bg-pastel-lavender/60',
    rose: 'bg-pastel-rose/60',
    gray: 'bg-pastel-gray/60',
    stone: 'bg-pastel-stone/60',
  };
  return colorMap[color] || 'bg-pastel-yellow/60';
};

// Get random rotation for sticky note effect
const getRotation = (id: string): string => {
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];
  return rotations[hash % rotations.length];
};

export function StickyNoteCard({ note, onClick, isGrid = true }: StickyNoteCardProps) {
  const rotation = getRotation(note.id);
  
  const getPreview = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.slice(0, 80) + (plainText.length > 80 ? '...' : '');
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'sticky-note-card text-left group transition-all duration-200 w-full rounded-2xl p-4 relative overflow-hidden',
        getStickyBgClass(note.color),
        rotation,
        isGrid ? 'min-h-[120px]' : 'min-h-[80px]',
        'shadow-md hover:shadow-lg hover:scale-[1.02]',
        'active:scale-[0.98]'
      )}
    >
      {/* Folded corner effect */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/30 to-transparent rounded-bl-xl" />
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-black/5" />
      
      <div className={cn('flex', isGrid ? 'flex-col h-full' : 'items-start justify-between')}>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm font-medium text-foreground/90',
              isGrid ? 'line-clamp-4' : 'line-clamp-2'
            )}>
              {getPreview(note.content) || note.title || 'Empty note'}
            </p>
            {note.isPinned && (
              <Star className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" fill="currentColor" />
            )}
          </div>
        </div>
        
        <div className={cn(
          'flex items-center gap-2 flex-wrap',
          isGrid ? 'mt-auto pt-3' : 'mt-2'
        )}>
          <span className="text-xs text-foreground/50">
            {format(new Date(note.updatedAt), 'MMM d')}
          </span>
        </div>
      </div>
    </button>
  );
}