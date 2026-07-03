import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { TabNavigation } from '../components/navigation/TabNavigation';
import { Sidebar } from '../components/navigation/Sidebar';
import { useAppStore } from '../store/useAppStore';
import { CalendarViewComponent } from '../components/views/CalendarView';
import { TasksView } from '../components/views/TasksView';
import { NotesView } from '../components/views/NotesView';
import { ProfileView } from '../components/views/ProfileView';
import { CreateEventModal } from '../components/modals/CreateEventModal';
import { EditEventModal } from '../components/modals/EditEventModal';
import { CalendarNoteModal } from '../components/modals/CalendarNoteModal';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { StickyNoteEditor } from '../components/notes/StickyNoteEditor';
import { NoteEditor } from '../components/notes/NoteEditor';
import { QuickCreateMenu } from '../components/QuickCreateMenu';
import { FocusPickerModal, FocusCandidate, FocusItemType } from '../components/modals/FocusPickerModal';
import { BrainDumpSortModal, BrainDumpSortType } from '../components/modals/BrainDumpSortModal';
import { BrainDumpSheet, BrainDumpItem } from '../components/modals/BrainDumpSheet';
import { HabitsEditSheet, HabitRow } from '../components/modals/HabitsEditSheet';
import { CalendarNoteCreateSheet } from '../components/modals/CalendarNoteCreateSheet';
import { Search, Plus, Calendar, CheckSquare, FileText, Folder, Pin, PenLine, X, Bookmark, Lock, ChevronRight } from 'lucide-react';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { TrialReminderModal } from '../components/modals/TrialReminderModal';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { CalendarEvent, Note } from '../types';
import { startOfWeek, addDays, format as fmtDate, isToday as dateIsToday } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HabitCompletion {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
}

interface FocusItem {
  id: string;        // Supabase row id (for deletion)
  item_id: string;
  item_type: FocusItemType;
  title: string;
  subtitle: string;
}

// ─── Type icon helper ─────────────────────────────────────────────────────────

const TYPE_ICONS: Record<FocusItemType, React.ElementType> = {
  task:   CheckSquare,
  event:  Calendar,
  note:   FileText,
  sticky: Pin,
  custom: PenLine,
};

// ─── ISO week number (Monday = start of week) ────────────────────────────────
const getWeekNumber = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// ─── Swipeable focus card ─────────────────────────────────────────────────────

interface FocusCardProps {
  item: FocusItem;
  isCompleted: boolean;
  onRemove: () => void;
  onTap: () => void;
}

function FocusCard({ item, isCompleted, onRemove, onTap }: FocusCardProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const hasSwiped = useRef(false);

  const Icon = TYPE_ICONS[item.item_type] ?? PenLine;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    hasSwiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) {
      setOffset(dx);
      hasSwiped.current = true;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offset < -80) {
      setOffset(-500);
      setTimeout(onRemove, 200);
    } else {
      setOffset(0);
    }
  };

  const handleClick = () => {
    if (hasSwiped.current) return;
    onTap();
  };

  const canTap = item.item_type !== 'custom';

  return (
    <div
      style={{
        transform: `translateX(${offset}px)`,
        transition: offset === 0 || offset === -500 ? 'transform 0.2s ease' : 'none',
      }}
      className="bg-secondary rounded-xl px-3.5 py-3 flex items-center gap-3"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={canTap ? handleClick : undefined}
      role={canTap ? 'button' : undefined}
    >
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-foreground text-sm font-medium truncate',
          isCompleted && 'line-through opacity-50'
        )}>
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-muted-foreground text-xs truncate mt-0.5">{item.subtitle}</p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 active:scale-95"
        aria-label="Remove focus item"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}

// ─── UpgradePrompt component ──────────────────────────────────────────────────

function UpgradePrompt({ onGoToProfile }: { onGoToProfile: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pt-24 pb-32 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">Your trial has ended</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Subscribe to Planisa to unlock Tasks, Notes, and all features.
        </p>
      </div>
      <button
        onClick={onGoToProfile}
        className="mt-2 px-6 py-3.5 rounded-2xl bg-foreground text-background text-[15px] font-semibold active:scale-[0.98] transition-transform"
      >
        View plans
      </button>
    </div>
  );
}

// ─── DashboardHome component ──────────────────────────────────────────────────

interface DashboardHomeProps {
  user: any;
  userName: string;
  focusItems: FocusItem[];
  loadingFocus: boolean;
  onAddFocus: () => void;
  onRemoveFocus: (id: string) => void;
  onTapFocus: (item: FocusItem) => void;
  brainDumpText: string;
  setBrainDumpText: React.Dispatch<React.SetStateAction<string>>;
  brainDumpItems: BrainDumpItem[];
  onSaveBrainDump: (text: string) => Promise<void>;
  onDeleteBrainDumpItem: (id: string) => void;
  onNavigateToCalendar: () => void;
  onNavigateToTasks: () => void;
  onNavigateToNotes: () => void;
  onOpenNote: (note: Note) => void;
  onProfileClick: () => void;
  onSaveAndOpenNote: (note: Note) => void;
  habits: HabitRow[];
  completions: HabitCompletion[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: (name: string) => void;
  onUpdateHabit: (id: string, name: string) => void;
  onDeleteHabit: (id: string) => void;
  trialNisaMessage?: string | null;
  onTrialUpgrade?: (() => void) | null;
  hasFullAccess?: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  userName,
  focusItems,
  loadingFocus,
  onAddFocus,
  onRemoveFocus,
  onTapFocus,
  brainDumpText,
  setBrainDumpText,
  brainDumpItems,
  onSaveBrainDump,
  onDeleteBrainDumpItem,
  onNavigateToCalendar,
  onNavigateToTasks,
  onNavigateToNotes,
  onOpenNote,
  onProfileClick,
  onSaveAndOpenNote,
  habits,
  completions,
  onToggleHabit,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  trialNisaMessage,
  onTrialUpgrade,
  hasFullAccess = true,
}) => {
  const { tasks, events, notes, folders, settings, isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, setHighlightTaskId } = useAppStore();

  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract a snippet around the first match in `text`, preserving original case.
    const snip = (text: string, pad = 40): { pre: string; match: string; post: string } | null => {
      if (!text) return null;
      const idx = text.toLowerCase().indexOf(q);
      if (idx === -1) return null;
      const start = Math.max(0, idx - pad);
      const end = Math.min(text.length, idx + q.length + pad);
      return {
        pre: (start > 0 ? '…' : '') + text.slice(start, idx),
        match: text.slice(idx, idx + q.length),
        post: text.slice(idx + q.length, end) + (end < text.length ? '…' : ''),
      };
    };

    type Snip = { pre: string; match: string; post: string; isContent: boolean };
    type R = { type: 'task' | 'note' | 'folder' | 'event'; id: string; itemTitle: string; snippet: Snip | null };
    const out: R[] = [];

    tasks.filter(t => !t.hidden && (t.title.toLowerCase().includes(q) || stripHtml(t.note ?? '').toLowerCase().includes(q)))
      .slice(0, 4).forEach(t => {
        const ts = snip(t.title);
        const ns = t.note ? snip(stripHtml(t.note)) : null;
        const snippet: Snip | null = ts ? { ...ts, isContent: false } : ns ? { ...ns, isContent: true } : null;
        out.push({ type: 'task', id: t.id, itemTitle: t.title, snippet });
      });

    notes.filter(n => n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q))
      .slice(0, 4).forEach(n => {
        const plainContent = stripHtml(n.content ?? '');
        const ts = n.title?.trim() ? snip(n.title) : null;
        const cs = snip(plainContent);
        const snippet: Snip | null = ts ? { ...ts, isContent: false } : cs ? { ...cs, isContent: true } : null;
        const rawTitle = n.title?.trim() ?? '';
        const itemTitle = rawTitle && rawTitle.toLowerCase() !== 'untitled' ? rawTitle : '';
        out.push({ type: 'note', id: n.id, itemTitle, snippet });
      });

    folders.filter(f => f.name.toLowerCase().includes(q))
      .slice(0, 3).forEach(f => {
        const s = snip(f.name);
        out.push({ type: 'folder', id: f.id, itemTitle: f.name, snippet: s ? { ...s, isContent: false } : null });
      });

    events.filter(e => e.title.toLowerCase().includes(q) || stripHtml(e.description ?? '').toLowerCase().includes(q))
      .slice(0, 3).forEach(e => {
        const ts = snip(e.title);
        const ds = e.description ? snip(stripHtml(e.description)) : null;
        const snippet: Snip | null = ts ? { ...ts, isContent: false } : ds ? { ...ds, isContent: true } : null;
        out.push({ type: 'event', id: e.id, itemTitle: e.title, snippet });
      });

    return out;
  })();

  const handleSearchResultClick = (type: 'task' | 'note' | 'folder' | 'event', id: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (type === 'task') {
      setHighlightTaskId(id);
      onNavigateToTasks();
    } else if (type === 'note') {
      const note = notes.find(n => n.id === id);
      if (note) onOpenNote(note);
    } else if (type === 'folder') {
      onNavigateToNotes();
    } else {
      onNavigateToCalendar();
    }
  };

  const [showHabitEdit, setShowHabitEdit] = useState(false);
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  const [nisaHidden, setNisaHidden] = useState(false);
  const [showNisaBubble, setShowNisaBubble] = useState(false);

  // nisa-reset: wakes NISA from anywhere by firing window.dispatchEvent(new Event('nisa-reset'))
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('nisa_dismissed_message');
      setNisaHidden(false);
      setShowNisaBubble(true);
    };
    window.addEventListener('nisa-reset', handler);
    return () => window.removeEventListener('nisa-reset', handler);
  }, []);

  const handleNisaIconClick = () => setShowNisaBubble(v => !v);
  const dismissNisaBubble = () => {
    localStorage.setItem('nisa_dismissed_message', nisaMessage);
    setNisaHidden(true);
    setShowNisaBubble(false);
  };

  // Compute Mon–Sun dates for this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return fmtDate(d, 'yyyy-MM-dd');
  });

  // ── Nisa smart message ──────────────────────────────────────────────────────
  const todayStr = fmtDate(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  const taskFocusItems = focusItems.filter(f => f.item_type === 'task');
  const allTasksDone = taskFocusItems.length > 0 &&
    taskFocusItems.every(f => tasks.find(t => t.id === f.item_id)?.completed);
  const anyTaskDone = taskFocusItems.some(f => tasks.find(t => t.id === f.item_id)?.completed);
  const habitsCompletedToday = completions.some(c => c.date === todayStr);
  // True only when the user completed habits on a prior day this week — avoids a false
  // "you're on a streak" message at the start of the week when no streak exists yet.
  const hasStreakThisWeek = completions.some(c => c.date < todayStr);

  const dayColorMessages: Record<number, string> = {
    0: "Today's color is purple. Sunday is for rest and reflection. Recharge. 💜",
    1: "Today's color is silver. Monday is the Moon's day, a time for calm and fresh beginnings. 🤍",
    2: "Today's color is red. Tuesday brings drive, action and momentum. Use that energy. ❤️",
    3: "Today's color is yellow. For communication, ideas and creativity. Let your thoughts flow. 💛",
    4: "Today's color is blue. A symbol of focus and strength. Push through. 💙",
    5: "Today's color is green. Joy and harmony to close the week. Happy Friday! 💚",
    6: "Today's color is orange. For adventure, freedom and no agenda. 🧡",
  };

  let nisaMessage: string;
  let nisaAction: (() => void) | null = null;

  if (currentHour < 12) {
    nisaMessage = dayColorMessages[new Date().getDay()];
  } else if (focusItems.length === 0) {
    nisaMessage = "You haven't set your focus for this week yet. What's the one thing that matters most? ✨";
  } else if (allTasksDone) {
    nisaMessage = "You've completed everything in your focus list this week. Incredible! 🎉";
  } else if (brainDumpItems.length > 0) {
    const n = brainDumpItems.length;
    nisaMessage = `You have ${n} unsorted brain dump item${n === 1 ? '' : 's'} waiting. Want to sort them now?`;
    nisaAction = () => setShowBrainDumpSheet(true);
  } else if (habits.length > 0 && !habitsCompletedToday && hasStreakThisWeek) {
    nisaMessage = "Don't forget your habits today — you're on a streak! 💪";
  } else if (currentHour >= 17 && taskFocusItems.length > 0 && !anyTaskDone) {
    nisaMessage = "Still time to knock out your focus items before the week is over 🌙";
  } else {
    nisaMessage = `You're all set for today, ${userName}. Let's make it count! 🌟`;
  }

  // Override with trial reminder when set (takes priority over all other messages)
  if (trialNisaMessage) {
    nisaMessage = trialNisaMessage;
    nisaAction = onTrialUpgrade ?? null;
  }

  // Persist nisa message so ProfileView can read it even after navigation
  useEffect(() => {
    localStorage.setItem('nisa_last_message', nisaMessage);
  }, [nisaMessage]);

  // Auto-popup: show bubble when message changes; stay hidden when message was dismissed.
  // Debounced 300ms so the initial empty-state message (before async data loads) doesn't
  // race with the real message that follows once focus/habits data arrives.
  useEffect(() => {
    const t = setTimeout(() => {
      const dismissed = localStorage.getItem('nisa_dismissed_message');
      const lastSeen = localStorage.getItem('nisa_last_seen_message');
      if (dismissed === nisaMessage) {
        setNisaHidden(true);
        setShowNisaBubble(false);
      } else if (lastSeen !== nisaMessage) {
        localStorage.setItem('nisa_last_seen_message', nisaMessage);
        setNisaHidden(false);
        setShowNisaBubble(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [nisaMessage]);

  // Brain dump sheet + sort modal state
  const [showBrainDumpSheet, setShowBrainDumpSheet] = useState(false);
  const [sortModal, setSortModal] = useState<{ text: string; type: 'event' | 'note'; itemId: string | null } | null>(null);
  // Full editor state (opened via "+ add details" from event/note sort modal)
  const [fullEditor, setFullEditor] = useState<{ type: 'event' | 'note'; title: string } | null>(null);
  // Sticky note editor state (opened when tapping Sticky sort button)
  const [stickyEditor, setStickyEditor] = useState<{ text: string; itemId: string | null } | null>(null);
  // Task creation state (opened directly when tapping Task sort button)
  const [taskDump, setTaskDump] = useState<{ text: string; itemId: string | null } | null>(null);

  const handleBrainDumpSort = (type: BrainDumpSortType) => {
    const text = brainDumpText.trim();
    if (!text) return;
    if (type === 'sticky') {
      setStickyEditor({ text, itemId: null });
      return;
    }
    if (type === 'task') {
      setTaskDump({ text, itemId: null });
      return;
    }
    setSortModal({ text: brainDumpText, type, itemId: null });
  };

  const handleSaveForLater = async () => {
    if (!brainDumpText.trim()) return;
    await onSaveBrainDump(brainDumpText);
    setBrainDumpText('');
  };

  const handleSheetSort = (item: BrainDumpItem, type: BrainDumpSortType) => {
    setShowBrainDumpSheet(false);
    if (type === 'sticky') {
      setStickyEditor({ text: item.content, itemId: item.id });
      return;
    }
    if (type === 'task') {
      setTaskDump({ text: item.content, itemId: item.id });
      return;
    }
    setSortModal({ text: item.content, type, itemId: item.id });
  };

  const handleSortModalDone = () => {
    if (sortModal?.itemId) {
      onDeleteBrainDumpItem(sortModal.itemId);
    } else {
      setBrainDumpText('');
    }
    setSortModal(null);
  };

  const handleOpenFullEditor = (title: string) => {
    if (!sortModal) return;
    setFullEditor({ type: sortModal.type, title });
    setSortModal(null);
    // don't call onSorted — item stays in brain dump list until explicitly sorted or deleted
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const isTaskCompleted = (item: FocusItem) => {
    if (item.item_type !== 'task') return false;
    return tasks.find(t => t.id === item.item_id)?.completed ?? false;
  };

  const todayEvents = events.filter(e => dateIsToday(new Date(e.date)));
  const todayTasks = tasks.filter(t => t.date && dateIsToday(new Date(t.date)) && !t.hidden);
  const hhmm = (t?: string) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const todayItems = [
    ...todayEvents.map(e => ({
      id: `e-${e.id}`,
      title: e.title,
      time: e.isAllDay ? undefined : e.startTime,
      color: (e.color || 'peony') as string,
      completed: false,
      sortKey: e.isAllDay ? -1 : (hhmm(e.startTime) ?? 10000),
    })),
    ...todayTasks.map(t => ({
      id: `t-${t.id}`,
      title: t.title,
      time: t.time,
      color: t.color as string,
      completed: t.completed,
      sortKey: hhmm(t.time) ?? 10000,
    })),
  ].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="overflow-y-auto pt-safe-2 relative">
      {/* Gradient background */}
      <style>{`
        @keyframes gradient-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.06) translateY(-2%); }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="md:hidden"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '650px',
          background: [
            'linear-gradient(180deg, rgba(190, 140, 255, 0.55) 0%, rgba(220, 120, 200, 0.35) 40%, transparent 100%)', // 0 Sun
            'linear-gradient(180deg, rgba(210, 210, 225, 0.55) 0%, rgba(190, 185, 220, 0.35) 40%, transparent 100%)', // 1 Mon
            'linear-gradient(180deg, rgba(255, 120, 150, 0.55) 0%, rgba(180, 80, 140, 0.35) 40%, transparent 100%)',  // 2 Tue
            settings.theme === 'dark'
              ? 'linear-gradient(180deg, rgba(180, 120, 0, 0.25) 0%, rgba(180, 120, 0, 0.12) 40%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255, 220, 100, 0.55) 0%, rgba(255, 170, 60, 0.35) 40%, transparent 100%)',  // 3 Wed
            'linear-gradient(180deg, rgba(100, 160, 255, 0.55) 0%, rgba(130, 110, 240, 0.35) 40%, transparent 100%)', // 4 Thu
            'linear-gradient(180deg, rgba(180, 220, 140, 0.55) 0%, rgba(150, 195, 110, 0.35) 40%, transparent 100%)', // 5 Fri
            'linear-gradient(180deg, rgba(255, 160, 80, 0.55) 0%, rgba(240, 110, 90, 0.35) 40%, transparent 100%)',   // 6 Sat
          ][previewDay ?? new Date().getDay()],
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'gradient-breathe 5s ease-in-out infinite',
        }}
      />
      {/* Header */}
      <div className="px-4 pb-4 relative z-50">
        {isSearchOpen ? (
          <div className="relative">
            <div className="flex items-center gap-3 h-12">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-secondary/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm outline-none"
                autoFocus
              />
              <button
                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                className="text-sm font-medium text-primary whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-3 text-center">No results</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {searchResults.map((r) => {
                      const Icon = r.type === 'task' ? CheckSquare : r.type === 'folder' ? Folder : r.type === 'event' ? Calendar : FileText;
                      const label = r.type === 'task' ? 'Task' : r.type === 'folder' ? 'Folder' : r.type === 'event' ? 'Event' : 'Note';
                      const { snippet, itemTitle } = r;
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => handleSearchResultClick(r.type, r.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 active:bg-secondary transition-colors"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 text-sm min-w-0 truncate">
                            {snippet ? (
                              <>
                                {snippet.isContent && itemTitle?.trim() && (
                                  <span className="text-muted-foreground">{itemTitle} · </span>
                                )}
                                <span className="text-foreground/60">{snippet.pre}</span>
                                <span className="text-foreground font-semibold">{snippet.match}</span>
                                <span className="text-foreground/60">{snippet.post}</span>
                              </>
                            ) : (
                              <span className="text-foreground">{itemTitle || 'Empty note'}</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground/60 flex-shrink-0 ml-1">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="flow-page-title">Hi, {userName} 👋🏽</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                aria-label="Open search"
              >
                <Search className="w-6 h-6 text-muted-foreground" />
              </button>
              <button
                onClick={onProfileClick}
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary"
                aria-label="Open profile"
              >
                {settings.avatarType === 'image' && settings.avatarUrl ? (
                  <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : settings.avatarType === 'emoji' && settings.avatarEmoji ? (
                  <span className="text-lg leading-none">{settings.avatarEmoji}</span>
                ) : (
                  <span className="text-primary-foreground font-semibold text-sm">
                    {settings.avatarInitial || userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-32 relative z-10">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
        {/* ── Today: two cards side by side ────────────────────────────── */}
        <div className="flex flex-row gap-3 mx-1 md:mx-0 md:col-span-2 order-0">
        <button
          onClick={onNavigateToCalendar}
          className="flow-widget flex-1 min-w-0 text-left active:scale-[0.99] transition-transform flex flex-col justify-between"
        >
          <div>
            <p className="text-[56px] font-bold leading-none tracking-tight text-foreground">
              {fmtDate(today, 'd')}
            </p>
            <p className="text-[15px] font-semibold text-foreground/80 mt-2 leading-none">
              {fmtDate(today, 'EEEE')}
            </p>
            <p className="text-[13px] text-muted-foreground/60 mt-1 leading-none">
              {fmtDate(today, 'MMMM')}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/40 font-medium tracking-wide mt-4">
            W {getWeekNumber(today)}
          </p>
        </button>

        {/* ── Today: agenda card ───────────────────────────────────────── */}
        <button
          onClick={onNavigateToCalendar}
          className="flow-widget flex-1 min-w-0 text-left active:scale-[0.99] transition-transform flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="flow-section-title">Today</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
          {todayItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {todayItems.slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', `bg-pastel-${item.color}`)} />
                  <span className={cn(
                    'flex-1 text-[13px] leading-snug truncate',
                    item.completed && 'line-through text-muted-foreground/40'
                  )}>
                    {item.title}
                  </span>
                  {item.time && (
                    <span className="text-[12px] text-muted-foreground/45 flex-shrink-0 tabular-nums">
                      {item.time}
                    </span>
                  )}
                </div>
              ))}
              {todayItems.length > 4 && (
                <p className="text-[12px] text-muted-foreground/40 mt-0.5">
                  +{todayItems.length - 4} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground/50">No plans today</p>
          )}
        </button>
        </div>

        {/* ── Weekly Focus ──────────────────────────────────────────────── */}
        <div className="flow-widget order-1 md:order-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-section-title">Weekly Focus</h2>
            {focusItems.length < 3 && (
              <button
                onClick={onAddFocus}
                className="text-foreground/60 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>add focus</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 overflow-hidden">
            {loadingFocus && (
              <p className="text-muted-foreground text-sm">Loading…</p>
            )}
            {!loadingFocus && focusItems.length === 0 && (
              <p className="text-muted-foreground text-sm">Nothing in focus yet. What matters most this week?</p>
            )}
            {!loadingFocus && focusItems.map(item => (
              <FocusCard
                key={item.id}
                item={item}
                isCompleted={isTaskCompleted(item)}
                onRemove={() => onRemoveFocus(item.id)}
                onTap={() => onTapFocus(item)}
              />
            ))}
          </div>
        </div>

        {/* ── Habits ───────────────────────────────────────────────────── */}
        <div className="flow-widget order-3 md:order-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-section-title">Habits</h2>
            <button
              onClick={() => setShowHabitEdit(true)}
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              Edit
            </button>
          </div>
          {habits.length === 0 ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <p className="text-sm text-muted-foreground">No habits yet</p>
              <button
                onClick={() => setShowHabitEdit(true)}
                className="flex items-center gap-1.5 text-sm text-primary font-medium"
              >
                <Plus className="w-4 h-4" />
                Add habit
              </button>
            </div>
          ) : (
            <>
              {/* Day labels */}
              <div className="flex items-center mb-2">
                <div className="flex-1" />
                <div className="flex gap-1.5">
                  {weekDates.map((date, i) => {
                    const dayLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
                    const isToday = dateIsToday(addDays(weekStart, i));
                    return (
                      <div key={date} className={cn('w-6 text-center text-[10px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground/50')}>
                        {dayLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                {habits.map(habit => {
                  return (
                    <div key={habit.id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-foreground truncate">{habit.name}</span>
                      <div className="flex gap-1.5">
                        {weekDates.map(date => {
                          const done = completions.some(c => c.habit_id === habit.id && c.date === date);
                          const isToday = date === fmtDate(new Date(), 'yyyy-MM-dd');
                          return (
                            <button
                              key={date}
                              onClick={() => onToggleHabit(habit.id, date)}
                              className={cn(
                                'w-6 h-6 rounded-full transition-all active:scale-90',
                                done
                                  ? 'bg-foreground'
                                  : isToday
                                    ? 'border-2 border-foreground/40 dark:border-foreground/50'
                                    : 'border border-muted-foreground/25 dark:border-foreground/30'
                              )}
                              aria-label={`${habit.name} ${date}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Brain dump ────────────────────────────────────────────────── */}
        <div className="flow-widget md:col-span-2 order-2 md:order-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-section-title">Brain dump</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveForLater}
                disabled={!brainDumpText.trim()}
                className="flex items-center gap-1.5 text-foreground text-sm font-medium disabled:opacity-30"
              >
                <Bookmark className="w-4 h-4" />
                Save for later
              </button>
              {brainDumpItems.length > 0 && (
                <button
                  onClick={() => setShowBrainDumpSheet(true)}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-foreground"
                  aria-label={`${brainDumpItems.length} saved items`}
                >
                  <span className="text-background text-[10px] font-bold leading-none">
                    {brainDumpItems.length > 9 ? '9+' : brainDumpItems.length}
                  </span>
                </button>
              )}
            </div>
          </div>
          <textarea
            value={brainDumpText}
            onChange={e => setBrainDumpText(e.target.value)}
            placeholder="Write anything… sort later."
            className="w-full h-24 p-3 bg-secondary border-0 rounded-xl resize-none mb-4 flow-input"
          />
          <div className="flex space-x-4">
            <button
              className={cn("flex items-center space-x-2", hasFullAccess ? "text-muted-foreground" : "text-muted-foreground/30")}
              onClick={() => hasFullAccess && handleBrainDumpSort('task')}
              disabled={!hasFullAccess}
            >
              {hasFullAccess ? <CheckSquare className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              <span className="flow-meta">Task</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('event')}>
              <Calendar className="w-5 h-5" /><span className="flow-meta">Event</span>
            </button>
            <button
              className={cn("flex items-center space-x-2", hasFullAccess ? "text-muted-foreground" : "text-muted-foreground/30")}
              onClick={() => hasFullAccess && handleBrainDumpSort('note')}
              disabled={!hasFullAccess}
            >
              {hasFullAccess ? <FileText className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              <span className="flow-meta">Note</span>
            </button>
            <button
              className={cn("flex items-center space-x-2", hasFullAccess ? "text-muted-foreground" : "text-muted-foreground/30")}
              onClick={() => hasFullAccess && handleBrainDumpSort('sticky')}
              disabled={!hasFullAccess}
            >
              {hasFullAccess ? <Pin className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              <span className="flow-meta">Sticky</span>
            </button>
          </div>
        </div>
        </div>

      </div>

      {/* Brain dump sheet + sort modal */}
      <BrainDumpSheet
        isOpen={showBrainDumpSheet}
        items={brainDumpItems}
        onClose={() => setShowBrainDumpSheet(false)}
        onSort={handleSheetSort}
        onDelete={onDeleteBrainDumpItem}
        hasFullAccess={hasFullAccess}
      />
      {sortModal && (
        <BrainDumpSortModal
          isOpen
          text={sortModal.text}
          type={sortModal.type}
          onClose={() => setSortModal(null)}
          onSorted={handleSortModalDone}
          onOpenFullEditor={handleOpenFullEditor}
          onSaveAndOpenNote={onSaveAndOpenNote}
        />
      )}
      {/* Sticky note editor opened from brain dump sort */}
      {stickyEditor && (
        <StickyNoteEditor
          initialContent={stickyEditor.text}
          onClose={() => {
            if (stickyEditor.itemId) {
              onDeleteBrainDumpItem(stickyEditor.itemId);
            } else {
              setBrainDumpText('');
            }
            setStickyEditor(null);
          }}
        />
      )}
      {/* Task modal opened directly from brain dump sort */}
      {taskDump && (
        <AddTaskModal
          isOpen
          defaultTitle={taskDump.text}
          onSaved={() => {
            if (taskDump.itemId) {
              onDeleteBrainDumpItem(taskDump.itemId);
            } else {
              setBrainDumpText('');
            }
          }}
          onClose={() => setTaskDump(null)}
        />
      )}
      {/* Full editors opened via "+ add details" (event/note only) */}
      {fullEditor?.type === 'event' && (
        <CreateEventModal
          isOpen
          initialTitle={fullEditor.title}
          onClose={() => setFullEditor(null)}
        />
      )}
      {fullEditor?.type === 'note' && (
        <CalendarNoteCreateSheet
          isOpen
          date={new Date()}
          time=""
          initialTitle={fullEditor.title}
          onClose={() => setFullEditor(null)}
          onOpenInNotes={() => setFullEditor(null)}
        />
      )}

      <HabitsEditSheet
        isOpen={showHabitEdit}
        habits={habits}
        onClose={() => setShowHabitEdit(false)}
        onAdd={onAddHabit}
        onUpdate={onUpdateHabit}
        onDelete={onDeleteHabit}
      />

      {/* Nisa — peeks up from behind top-right corner of left Today card (mobile only) */}
      <div className="md:hidden">
      {!nisaHidden && (
        <>
          {/* Dismiss overlay — single tap anywhere outside bubble/Nisa closes it */}
          {showNisaBubble && (
            <div
              className="fixed inset-0"
              style={{ zIndex: 49 }}
              onClick={() => setShowNisaBubble(false)}
            />
          )}

          {/* Speech bubble — fixed, to the RIGHT of Nisa */}
          {showNisaBubble && (
            <div
              className="fixed"
              style={{
                top: 'calc(env(safe-area-inset-top, 0px) + 3.875rem)',
                left: 'calc(50% + 4px)',
                right: '12px',
                zIndex: 50,
                transform: 'rotate(-2deg)',
              }}
            >
              <div className="bg-card border border-border rounded-2xl px-3 py-2.5 shadow-lg relative">
                <p className="text-xs text-foreground leading-snug">{nisaMessage}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {nisaAction && (
                    <button
                      onClick={() => { setShowNisaBubble(false); nisaAction!(); }}
                      className="text-xs text-primary font-medium"
                    >
                      {trialNisaMessage ? 'Upgrade →' : 'Sort now →'}
                    </button>
                  )}
                  <button
                    onClick={dismissNisaBubble}
                    className="text-xs text-muted-foreground/50"
                  >
                    dismiss
                  </button>
                </div>
                {/* Tail pointing left toward Nisa */}
                <span
                  className="absolute top-3 -left-2 w-0 h-0"
                  style={{
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: '7px solid hsl(var(--border))',
                  }}
                />
                <span
                  className="absolute top-3 -left-[6px] w-0 h-0"
                  style={{
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: '7px solid hsl(var(--card))',
                  }}
                />
              </div>
            </div>
          )}

          {/* Nisa icon — visual layer, behind cards when resting */}
          <div
            className="fixed"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 3.875rem)',
              right: 'calc(50% + 8px)',
              zIndex: showNisaBubble ? 50 : 9,
              transform: showNisaBubble ? 'translateY(-32px)' : 'translateY(0)',
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <img
              src="/nisa.png"
              alt="Nisa"
              style={{
                width: '60px',
                height: '60px',
                display: 'block',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                objectFit: 'contain',
                transform: 'rotate(-8deg)',
              }}
            />
          </div>

          {/* Transparent hit area — always z-51 so Nisa is always tappable */}
          <button
            onClick={handleNisaIconClick}
            aria-label="Talk to Nisa"
            className="fixed"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 3.875rem)',
              right: 'calc(50% + 8px)',
              width: '60px',
              height: '30px',
              zIndex: 51,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          />
        </>
      )}
      </div>
    </div>
  );
};

// ─── Dashboard (root) ─────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user, hasFullAccess, userRecord, refreshUserRecord } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, setHighlightTaskId, events, notes } = useAppStore();

  // Show onboarding once — determined synchronously from auth metadata so there's no flash
  const [showOnboarding] = useState(() => !user?.user_metadata?.onboarding_completed);

  const [activeTab, setActiveTabRaw] = useState('home');
  const [userName, setUserName] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding);

  // Focus items — loaded from Supabase
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  // Overlay state for focus item taps — all stay on Dashboard
  const [focusEditEvent, setFocusEditEvent] = useState<CalendarEvent | null>(null);
  const [focusEditTaskId, setFocusEditTaskId] = useState<string | null>(null);
  const [focusNote, setFocusNote] = useState<Note | null>(null);
  const [showFocusNoteEditor, setShowFocusNoteEditor] = useState(false);
  const [focusStickyNote, setFocusStickyNote] = useState<Note | null>(null);

  // Brain dump items — saved for later
  const [brainDumpItems, setBrainDumpItems] = useState<BrainDumpItem[]>([]);

  // Habits
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  // Quick-create / modals
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateAnchor, setQuickCreateAnchor] = useState<DOMRect | null>(null);
  const sidebarPlusRef = useRef<HTMLButtonElement>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [defaultTaskDate, setDefaultTaskDate] = useState<Date | undefined>(undefined);
  const [showCalendarTaskCreate, setShowCalendarTaskCreate] = useState(false);
  const [calendarStartView, setCalendarStartView] = useState<'month' | 'weekday'>('month');

  const setActiveTab = (tab: string) => {
    if (tab !== 'calendar') setCalendarStartView('month');
    setActiveTabRaw(tab);
  };

  // Trial reminder state
  const [trialNisaMessage, setTrialNisaMessage] = useState<string | null>(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // ── Load focus items for this week ─────────────────────────────────────────
  const currentWeekNumber = getWeekNumber(new Date());
  const currentYear = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    return d.getFullYear();
  })();

  const loadFocusItems = useCallback(async () => {
    if (!user) return;
    setLoadingFocus(true);
    try {
      const { data, error } = await supabase
        .from('focus_items')
        .select('id, item_id, item_type, title, subtitle')
        .eq('user_id', user.id)
        .eq('week_number', currentWeekNumber)
        .eq('year', currentYear)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFocusItems(
        (data ?? []).map(r => ({
          id: r.id,
          item_id: r.item_id,
          item_type: r.item_type as FocusItemType,
          title: r.title,
          subtitle: r.subtitle ?? '',
        }))
      );
    } catch (err) {
      console.error('[Focus] loadFocusItems error:', err);
    } finally {
      setLoadingFocus(false);
    }
  }, [user, currentWeekNumber, currentYear]);

  // ── Add confirmed focus items ───────────────────────────────────────────────
  const handleFocusConfirm = async (candidates: FocusCandidate[]) => {
    if (!user) return;
    setShowFocusPicker(false);
    console.log('[Focus] confirm called with', candidates.length, 'items:', candidates);

    const rows = candidates.map(c => ({
      user_id: user.id,
      item_type: c.item_type,
      item_id: c.item_id,
      title: c.title,
      subtitle: c.subtitle,
      week_number: currentWeekNumber,
      year: currentYear,
    }));

    console.log('[Focus] inserting rows:', rows);
    const { data, error } = await supabase.from('focus_items').insert(rows).select();
    console.log('[Focus] insert result — data:', data, 'error:', error);
    if (error) {
      console.error('[Focus] insert error details:', error);
      toast.error(`Could not save: ${error.message}`);
      return;
    }

    const inserted: FocusItem[] = (data ?? []).map((r: any) => ({
      id: r.id,
      item_id: r.item_id,
      item_type: r.item_type as FocusItemType,
      title: r.title,
      subtitle: r.subtitle ?? '',
    }));
    setFocusItems(prev => [...prev, ...inserted]);
  };

  // ── Remove a focus item ─────────────────────────────────────────────────────
  const handleRemoveFocus = async (rowId: string) => {
    setFocusItems(prev => prev.filter(f => f.id !== rowId));
    await supabase.from('focus_items').delete().eq('id', rowId);
  };

  // ── Brain dump items ───────────────────────────────────────────────────────
  const loadBrainDumpItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('brain_dump_items')
      .select('id, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBrainDumpItems((data ?? []) as BrainDumpItem[]);
  }, [user]);

  const saveBrainDump = async (text: string) => {
    if (!user || !text.trim()) return;
    const { data, error } = await supabase
      .from('brain_dump_items')
      .insert({ user_id: user.id, content: text.trim() })
      .select()
      .single();
    if (error) { toast.error(`Could not save: ${error.message}`); return; }
    if (data) setBrainDumpItems(prev => [data as BrainDumpItem, ...prev]);
  };

  const deleteBrainDumpItem = async (id: string) => {
    setBrainDumpItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('brain_dump_items').delete().eq('id', id);
  };

  // ── Habits ─────────────────────────────────────────────────────────────────
  const loadHabits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('habits')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setHabits((data ?? []) as HabitRow[]);
  }, [user]);

  const loadCompletions = useCallback(async () => {
    if (!user) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monday = fmtDate(weekStart, 'yyyy-MM-dd');
    const sunday = fmtDate(addDays(weekStart, 6), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('habit_completions')
      .select('id, habit_id, date')
      .eq('user_id', user.id)
      .gte('date', monday)
      .lte('date', sunday);
    setCompletions((data ?? []) as HabitCompletion[]);
  }, [user]);

  const toggleHabit = async (habitId: string, date: string) => {
    if (!user) return;
    const existing = completions.find(c => c.habit_id === habitId && c.date === date);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      await supabase.from('habit_completions').delete().eq('id', existing.id);
    } else {
      const { data, error } = await supabase
        .from('habit_completions')
        .insert({ user_id: user.id, habit_id: habitId, date })
        .select('id, habit_id, date')
        .single();
      if (!error && data) setCompletions(prev => [...prev, data as HabitCompletion]);
    }
  };

  const addHabit = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, name, color: '#9674cc' })
      .select('id, name, color')
      .single();
    if (!error && data) setHabits(prev => [...prev, data as HabitRow]);
  };

  const updateHabit = async (id: string, name: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name } : h));
    await supabase.from('habits').update({ name }).eq('id', id);
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habit_id !== id));
    await supabase.from('habits').delete().eq('id', id);
  };

  // ── Tap a focus item → open overlay on top of Dashboard ───────────────────
  const handleTapFocus = (item: FocusItem) => {
    switch (item.item_type) {
      case 'task':
        setFocusEditTaskId(item.item_id);
        break;
      case 'event': {
        const evt = events.find(e => e.id === item.item_id);
        if (evt) setFocusEditEvent(evt);
        break;
      }
      case 'note': {
        const note = notes.find(n => n.id === item.item_id);
        if (note) setFocusNote(note);
        break;
      }
      case 'sticky': {
        const sticky = notes.find(n => n.id === item.item_id);
        if (sticky) setFocusStickyNote(sticky);
        break;
      }
      case 'custom':
        break;
    }
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const name = settings.name?.trim() || user.email?.split('@')[0] || 'User';
    setUserName(name.split(' ')[0]);
    loadFocusItems();
    loadBrainDumpItems();
    loadHabits();
    loadCompletions();
  }, [user, settings.name]);

  // ── Trial reminders ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userRecord || userRecord.subscription_status !== 'trialing' || !user) return;

    const trialEndMs = userRecord.trial_ends_at
      ? new Date(userRecord.trial_ends_at).getTime()
      : new Date(userRecord.trial_start_date).getTime() + 14 * 24 * 60 * 60 * 1000;

    const elapsed = (Date.now() - new Date(userRecord.trial_start_date).getTime()) / (1000 * 60 * 60 * 24);
    const day = Math.floor(elapsed);
    const daysRemaining = Math.ceil((trialEndMs - Date.now()) / (1000 * 60 * 60 * 24));

    if (day === 1) {
      const key = `trial_d1_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        const firstName = ((user.user_metadata?.display_name as string | undefined) || user.email || 'there')
          .split(' ')[0].split('@')[0];
        setTrialNisaMessage(
          `Hey ${firstName}! Great to have you here. Take a look around and explore, there's lots to discover. Tasks, notes, sticky notes and your calendar are all waiting for you!`
        );
      }
    }

    if (day === 2) {
      const key = `trial_d2_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        setTrialNisaMessage("Don't forget to add Planisa to your home screen for the full experience. It only takes a second!");
      }
    }

    if (daysRemaining >= 3 && daysRemaining <= 5) {
      const key = `trial_d10_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        setTrialNisaMessage(`Your trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade to keep full access to Tasks and Notes.`);
      }
    }

    if (daysRemaining <= 1) {
      const key = `trial_d13_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        setShowTrialModal(true);
      }
    }
  }, [userRecord, user]);

  // ── Stripe return: ?upgrade=success ────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get('upgrade') !== 'success') return;
    setSearchParams({}, { replace: true });
    setActiveTab('profile');
    refreshUserRecord().then(() => {
      toast.success("You're all set! Welcome to Planisa Pro.");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <DashboardHome
            user={user}
            userName={userName}
            focusItems={focusItems}
            loadingFocus={loadingFocus}
            onAddFocus={() => setShowFocusPicker(true)}
            onRemoveFocus={handleRemoveFocus}
            onTapFocus={handleTapFocus}
            brainDumpText={brainDumpText}
            setBrainDumpText={setBrainDumpText}
            brainDumpItems={brainDumpItems}
            onSaveBrainDump={saveBrainDump}
            onDeleteBrainDumpItem={deleteBrainDumpItem}
            onNavigateToCalendar={() => { setCalendarStartView('weekday'); setActiveTab('calendar'); }}
            onNavigateToTasks={() => setActiveTab('tasks')}
            onNavigateToNotes={() => setActiveTab('notes')}
            onOpenNote={(note) => {
              if (note.type === 'sticky') {
                setFocusStickyNote(note);
              } else {
                setFocusNote(note);
                setShowFocusNoteEditor(true);
              }
            }}
            onProfileClick={() => setActiveTab('profile')}
            onSaveAndOpenNote={(note) => {
              setFocusNote(note);
              setShowFocusNoteEditor(true);
            }}
            habits={habits}
            completions={completions}
            onToggleHabit={toggleHabit}
            onAddHabit={addHabit}
            onUpdateHabit={updateHabit}
            onDeleteHabit={deleteHabit}
            trialNisaMessage={trialNisaMessage}
            onTrialUpgrade={() => setActiveTab('profile')}
            hasFullAccess={hasFullAccess}
          />
        );
      case 'calendar':
        return (
          <CalendarViewComponent
            onDateChange={setSelectedCalendarDate}
            onNavigateToTasks={task => { setHighlightTaskId(task.id); setActiveTab('tasks'); }}
            hasFullAccess={hasFullAccess}
            initialView={calendarStartView}
          />
        );
      case 'tasks':
        if (!hasFullAccess) return <UpgradePrompt onGoToProfile={() => setActiveTab('profile')} />;
        return (
          <TasksView
            isCreatingNewTask={isCreatingNewTask}
            onCreatingTaskComplete={() => setIsCreatingNewTask(false)}
            defaultTaskDate={defaultTaskDate}
          />
        );
      case 'notes':
        if (!hasFullAccess) return <UpgradePrompt onGoToProfile={() => setActiveTab('profile')} />;
        return (
          <NotesView
            isCreatingNew={isCreatingNewNote}
            isCreatingStickyNote={isCreatingStickyNote}
            onCloseEditor={() => { setIsCreatingNewNote(false); setIsCreatingStickyNote(false); setIsEditingNote(false); }}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };

  const handleOnboardingComplete = (completedName: string) => {
    setOnboardingVisible(false);
    if (completedName) setUserName(completedName.split(' ')[0]);
  };

  return (
    <div className="min-h-screen bg-background" style={{ '--sidebar-w': sidebarExpanded ? '224px' : '64px' } as React.CSSProperties}>
      <div className={`transition-all duration-300 ${sidebarExpanded ? 'md:ml-56' : 'md:ml-16'} md:rounded-l-2xl md:shadow-lg min-h-screen${activeTab === 'calendar' ? ' dark:bg-[#1C1A18]' : ''}`}>
      {onboardingVisible && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
      <main className={`pb-24${activeTab === 'calendar' ? ' bg-white dark:bg-[#1C1A18] md:pb-0' : ''}`}>{renderView()}</main>

      <QuickCreateMenu
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        anchorRect={quickCreateAnchor}
        hasFullAccess={hasFullAccess}
        onCreateTask={() => {
          if (activeTab === 'calendar') { setShowCalendarTaskCreate(true); }
          else { setIsCreatingNewTask(true); setDefaultTaskDate(undefined); setActiveTab('tasks'); }
        }}
        onCreateEvent={() => { setShowCalendarTaskCreate(false); setShowEventModal(true); }}
        onCreateNote={() => { setIsCreatingNewNote(true); setIsCreatingStickyNote(false); setIsEditingNote(true); setActiveTab('notes'); }}
        onCreateStickyNote={() => { setIsCreatingStickyNote(true); setIsCreatingNewNote(true); setIsEditingNote(true); setActiveTab('notes'); }}
      />

      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} initialDate={selectedCalendarDate} />
      <AddTaskModal isOpen={showCalendarTaskCreate} onClose={() => setShowCalendarTaskCreate(false)} defaultDate={selectedCalendarDate} />

      {/* Focus item overlays — all stay on Dashboard */}
      <EditEventModal
        event={focusEditEvent}
        isOpen={!!focusEditEvent}
        onClose={() => setFocusEditEvent(null)}
      />
      <AddTaskModal
        isOpen={!!focusEditTaskId}
        editingTaskId={focusEditTaskId ?? undefined}
        onClose={() => setFocusEditTaskId(null)}
      />
      <CalendarNoteModal
        note={focusNote}
        isOpen={!!focusNote && !showFocusNoteEditor}
        onClose={() => { setFocusNote(null); setShowFocusNoteEditor(false); }}
        onOpenFullEditor={note => {
          if (note.type === 'sticky') {
            setFocusNote(null);
            setFocusStickyNote(note);
          } else {
            setShowFocusNoteEditor(true);
          }
        }}
      />
      {showFocusNoteEditor && focusNote && (
        <NoteEditor
          note={focusNote}
          onClose={() => { setFocusNote(null); setShowFocusNoteEditor(false); }}
          debugSource="Dashboard"
        />
      )}
      {focusStickyNote && (
        <StickyNoteEditor
          note={focusStickyNote}
          onClose={() => setFocusStickyNote(null)}
        />
      )}

      {/* Focus picker modal */}
      <FocusPickerModal
        isOpen={showFocusPicker}
        userId={user?.id ?? ''}
        currentCount={focusItems.length}
        onClose={() => setShowFocusPicker(false)}
        onConfirm={handleFocusConfirm}
        hasFullAccess={hasFullAccess}
      />

      {!onboardingVisible && (
        <>
          <div className="hidden md:block">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onPlusClick={() => {
                const rect = sidebarPlusRef.current?.getBoundingClientRect() ?? null;
                setQuickCreateAnchor(rect);
                setShowQuickCreate(v => !v);
              }}
              isPlusActive={showQuickCreate}
              onProfileClick={() => setActiveTab('profile')}
              isExpanded={sidebarExpanded}
              onExpandedChange={setSidebarExpanded}
              plusButtonRef={sidebarPlusRef}
            />
          </div>
          <div className="md:hidden">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onPlusClick={() => setShowQuickCreate(v => !v)}
              isPlusActive={showQuickCreate}
              lockedTabs={hasFullAccess ? [] : ['tasks', 'notes']}
            />
          </div>
        </>
      )}

      <TrialReminderModal
        isOpen={showTrialModal}
        onUpgrade={() => { setShowTrialModal(false); setActiveTab('profile'); }}
        onDismiss={() => setShowTrialModal(false)}
      />
      </div>
    </div>
  );
};

export default Dashboard;
