import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setContent('');
    setKeyboardOffset(0);
  }, [isOpen]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const kbHeight = window.innerHeight - vv.height;
      setKeyboardOffset(kbHeight > 50 ? kbHeight : 0);
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

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

  const dateDisplay = format(date, 'MMMM d, yyyy');

  const cardTop = keyboardOffset > 0
    ? `calc((100vh - ${keyboardOffset}px) / 2)`
    : '50%';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={saveAndClose}
      />

      {/* Centered card */}
      <div
        className={cn(
          'fixed left-4 right-4 z-[1200] rounded-3xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200',
          getStickyBgClass(color)
        )}
        style={{
          top: cardTop,
          transform: 'translateY(-50%)',
          maxHeight: '60vh',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Folded corner */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-white/30 to-transparent rounded-bl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-black/5 pointer-events-none" />

        {/* Top bar: date/time + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <span className="text-sm text-[#2C2C2A]/60">{dateDisplay} · {time}</span>
          <button
            onClick={saveAndClose}
            className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-4 h-4 text-[#2C2C2A]/70" />
          </button>
        </div>

        {/* Content textarea — no autoFocus so keyboard doesn't open immediately */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            className="w-full h-full bg-transparent border-0 outline-none resize-none text-lg text-[#2C2C2A]/90 placeholder:text-[#2C2C2A]/40 min-h-[120px]"
          />
        </div>
      </div>
    </>
  );
}
