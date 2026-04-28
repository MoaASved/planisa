import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { PastelColor } from '@/types';

interface CalendarStickyCreateSheetProps {
  date: Date;
  time: string;
  isOpen: boolean;
  onClose: () => void;
}

const getStickyBgClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-yellow';
};

const COLORS: PastelColor[] = ['coral', 'peach', 'amber', 'yellow', 'mint', 'teal', 'sky', 'lavender', 'rose', 'gray', 'stone'];

export function CalendarStickyCreateSheet({ date, time, isOpen, onClose }: CalendarStickyCreateSheetProps) {
  const { addNote } = useAppStore();
  const [content, setContent] = useState('');
  const [color] = useState<PastelColor>(() => COLORS[Math.floor(Math.random() * COLORS.length)]);

  if (!isOpen) return null;

  const saveAndClose = () => {
    if (content.trim()) {
      addNote({
        title: content.trim().slice(0, 30) || 'Sticky Note',
        content: content.trim(),
        type: 'sticky' as const,
        tags: [],
        date,
        time,
        isPinned: false,
        showInCalendar: true,
        color,
      });
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[1100]" onClick={saveAndClose} />
      <div className="fixed inset-x-0 bottom-0 z-[1200] animate-slide-up">
        <div
          className={cn('rounded-t-[32px] flex flex-col overflow-hidden', getStickyBgClass(color))}
          style={{ maxHeight: '60vh', boxShadow: '0 -16px 60px rgba(0,0,0,0.22), 0 -2px 8px rgba(0,0,0,0.08)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
            <span className="text-sm text-[#2C2C2A]/60">{time}</span>
            <button
              onClick={saveAndClose}
              className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-[#2C2C2A]/70" />
            </button>
          </div>

          {/* Folded corner */}
          <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/30 to-transparent rounded-bl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-black/5 pointer-events-none" />

          {/* Content textarea */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something…"
              autoFocus
              className="w-full h-full bg-transparent border-0 outline-none resize-none text-lg text-[#2C2C2A]/90 placeholder:text-[#2C2C2A]/40 min-h-[140px]"
            />
          </div>
        </div>
      </div>
    </>
  );
}
