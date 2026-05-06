import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { TabNavigation } from '../components/navigation/TabNavigation';
import { useAppStore } from '../store/useAppStore';
import { CalendarViewComponent } from '../components/views/CalendarView';
import { TasksView } from '../components/views/TasksView';
import { NotesView } from '../components/views/NotesView';
import { ProfileView } from '../components/views/ProfileView';
import { CreateEventModal } from '../components/modals/CreateEventModal';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { QuickCreateMenu } from '../components/QuickCreateMenu';
import { FocusPickerModal, FocusCandidate } from '../components/modals/FocusPickerModal';
import { Search, Plus, Mic, Calendar, CheckSquare, FileText, Pin, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Habit {
  id: string;
  name: string;
  days: boolean[];
}

interface FocusItem {
  id: string;       // Supabase row id (for deletion)
  item_id: string;
  item_type: 'task' | 'event' | 'note' | 'sticky';
  title: string;
  subtitle: string;
}

// ─── Type icon helper ─────────────────────────────────────────────────────────

const TYPE_ICONS: Record<FocusItem['item_type'], React.ElementType> = {
  task:   CheckSquare,
  event:  Calendar,
  note:   FileText,
  sticky: Pin,
};

const TYPE_LABELS: Record<FocusItem['item_type'], string> = {
  task:   'Task',
  event:  'Event',
  note:   'Note',
  sticky: 'Sticky',
};

// ─── DashboardHome component ──────────────────────────────────────────────────

interface DashboardHomeProps {
  user: any;
  userName: string;
  focusItems: FocusItem[];
  loadingFocus: boolean;
  onAddFocus: () => void;
  onRemoveFocus: (id: string) => void;
  brainDumpText: string;
  setBrainDumpText: React.Dispatch<React.SetStateAction<string>>;
  weekEvents: { [key: string]: number };
  showNisaBubble: boolean;
  dismissNisaBubble: () => void;
  toggleNisaBubble: () => void;
  onProfileClick: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  userName,
  focusItems,
  loadingFocus,
  onAddFocus,
  onRemoveFocus,
  brainDumpText,
  setBrainDumpText,
  weekEvents,
  showNisaBubble,
  dismissNisaBubble,
  toggleNisaBubble,
  onProfileClick,
}) => {
  const [habits] = useState<Habit[]>([
    { id: '1', name: 'Drink water', days: [true, true, false, true, true, false, false] },
    { id: '2', name: 'Exercise',    days: [false, true, true, false, true, true, false] },
    { id: '3', name: 'Read',        days: [true, false, true, true, false, true, true] },
  ]);

  const handleBrainDumpSort = (type: 'event' | 'task' | 'note' | 'sticky') => {
    if (!brainDumpText.trim()) return;
    toast.success(`Creating ${type} with: "${brainDumpText}"`);
    setBrainDumpText('');
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <div className="overflow-y-auto pt-safe-2">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="flow-page-title">Hi, {userName} 👋</h1>
            <p className="flow-meta mt-1">{todayString}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Search className="w-6 h-6 text-muted-foreground" />
            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold"
              aria-label="Open profile"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* ── Focus Today ───────────────────────────────────────────────── */}
        <div className="bg-[#1C1C1E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-section-title text-white">Focus today</h2>
            {focusItems.length < 3 && (
              <button
                onClick={onAddFocus}
                className="text-purple-400 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>add focus</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {loadingFocus && (
              <p className="text-gray-400 text-sm">Loading…</p>
            )}
            {!loadingFocus && focusItems.length === 0 && (
              <p className="text-gray-400 text-sm">No focus today</p>
            )}
            {!loadingFocus && focusItems.map(item => {
              const Icon = TYPE_ICONS[item.item_type];
              return (
                <div
                  key={item.id}
                  className="bg-white/10 rounded-xl px-3.5 py-3 flex items-center gap-3"
                >
                  <Icon className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-white/40 text-xs truncate">{item.subtitle || TYPE_LABELS[item.item_type]}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFocus(item.id)}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 active:scale-95"
                    aria-label="Remove focus item"
                  >
                    <X className="w-3 h-3 text-white/60" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Brain dump ────────────────────────────────────────────────── */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">Brain dump</h2>
          <textarea
            value={brainDumpText}
            onChange={e => setBrainDumpText(e.target.value)}
            placeholder="Write anything… sort later."
            className="w-full h-24 p-3 bg-secondary border-0 rounded-xl resize-none mb-4 flow-input"
          />
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('event')}>
              <Calendar className="w-5 h-5" /><span className="flow-meta">Event</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('task')}>
              <CheckSquare className="w-5 h-5" /><span className="flow-meta">Task</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('note')}>
              <FileText className="w-5 h-5" /><span className="flow-meta">Note</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('sticky')}>
              <Pin className="w-5 h-5" /><span className="flow-meta">Sticky</span>
            </button>
          </div>
        </div>

        {/* ── Habits ───────────────────────────────────────────────────── */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">Habits</h2>
          <div className="space-y-4">
            {habits.map(habit => (
              <div key={habit.id} className="flex items-center justify-between">
                <span className="flow-body">{habit.name}</span>
                <div className="flex space-x-1">
                  {habit.days.map((done, i) => (
                    <div key={i} className={cn('w-3 h-3 rounded-full', done ? 'bg-[#9674cc]' : 'border border-muted-foreground/30')} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── This week ────────────────────────────────────────────────── */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">This week</h2>
          <div className="flex justify-between">
            {weekDays.map((day, index) => (
              <div key={day} className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2',
                  index === todayIndex ? 'bg-[#1C1C1E] text-white' : 'text-muted-foreground'
                )}>
                  {day}
                </div>
                {weekEvents[index] && (
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(weekEvents[index], 3) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-primary rounded-full" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nisa bubble */}
      <div className="fixed bottom-28 left-4 z-50">
        <div
          onClick={toggleNisaBubble}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-lg shadow-lg transform -rotate-12 relative cursor-pointer"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">N</div>
        </div>
        {showNisaBubble && (
          <div className="relative mt-2">
            <button onClick={dismissNisaBubble} className="absolute -top-2 right-2 text-xs text-muted-foreground hover:text-foreground">
              dismiss for today
            </button>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-card max-w-xs">
              <p className="flow-body text-sm">Hi! I'm Nisa, your AI assistant. How can I help you today?</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Dashboard (root) ─────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings, setHighlightTaskId } = useAppStore();

  const [activeTab, setActiveTabRaw] = useState('home');
  const [userName, setUserName] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [weekEvents, setWeekEvents] = useState<{ [key: string]: number }>({});
  const [showNisaBubble, setShowNisaBubble] = useState(true);

  // Focus items — loaded from Supabase
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  // Quick-create / modals
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [defaultTaskDate, setDefaultTaskDate] = useState<Date | undefined>(undefined);
  const [showCalendarTaskCreate, setShowCalendarTaskCreate] = useState(false);

  const setActiveTab = (tab: string) => setActiveTabRaw(tab);

  // ── Load focus items for today ──────────────────────────────────────────────
  const todayDate = new Date().toISOString().split('T')[0];

  const loadFocusItems = useCallback(async () => {
    if (!user) return;
    setLoadingFocus(true);
    try {
      const { data, error } = await supabase
        .from('focus_items')
        .select('id, item_id, item_type, title, subtitle')
        .eq('user_id', user.id)
        .eq('date', todayDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFocusItems(
        (data ?? []).map(r => ({
          id: r.id,
          item_id: r.item_id,
          item_type: r.item_type as FocusItem['item_type'],
          title: r.title,
          subtitle: r.subtitle ?? '',
        }))
      );
    } catch (err) {
      console.error('[Focus] loadFocusItems error:', err);
    } finally {
      setLoadingFocus(false);
    }
  }, [user, todayDate]);

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
      date: todayDate,
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
      item_type: r.item_type as FocusItem['item_type'],
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

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const name = settings.name?.trim() || user.email?.split('@')[0] || 'User';
    setUserName(name.split(' ')[0]);
    const dismissedToday = localStorage.getItem(`nisa_dismissed_${new Date().toDateString()}`);
    setShowNisaBubble(!dismissedToday);
    fetchWeekEvents();
    loadFocusItems();
  }, [user, settings.name]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0d1117');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#faf9f7');
    }
  }, [settings.theme]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const fetchWeekEvents = async () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('events')
      .select('start_time')
      .eq('user_id', user?.id)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString());

    if (data && !error) {
      const counts: { [k: string]: number } = {};
      data.forEach(e => {
        const day = new Date(e.start_time).getDay();
        const adj = day === 0 ? 6 : day - 1;
        counts[adj] = (counts[adj] || 0) + 1;
      });
      setWeekEvents(counts);
    }
  };

  const dismissNisaBubble = () => {
    setShowNisaBubble(false);
    localStorage.setItem(`nisa_dismissed_${new Date().toDateString()}`, 'true');
  };

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
            brainDumpText={brainDumpText}
            setBrainDumpText={setBrainDumpText}
            weekEvents={weekEvents}
            showNisaBubble={showNisaBubble}
            dismissNisaBubble={dismissNisaBubble}
            toggleNisaBubble={() => setShowNisaBubble(v => !v)}
            onProfileClick={() => setActiveTab('profile')}
          />
        );
      case 'calendar':
        return (
          <CalendarViewComponent
            onDateChange={setSelectedCalendarDate}
            onNavigateToTasks={task => { setHighlightTaskId(task.id); setActiveTab('tasks'); }}
          />
        );
      case 'tasks':
        return (
          <TasksView
            isCreatingNewTask={isCreatingNewTask}
            setIsCreatingNewTask={setIsCreatingNewTask}
            defaultTaskDate={defaultTaskDate}
            setDefaultTaskDate={setDefaultTaskDate}
          />
        );
      case 'notes':
        return (
          <NotesView
            isEditingNote={isEditingNote}
            setIsEditingNote={setIsEditingNote}
            isCreatingNewNote={isCreatingNewNote}
            setIsCreatingNewNote={setIsCreatingNewNote}
            isCreatingStickyNote={isCreatingStickyNote}
            setIsCreatingStickyNote={setIsCreatingStickyNote}
            onCloseNoteEditor={() => { setIsCreatingNewNote(false); setIsCreatingStickyNote(false); setIsEditingNote(false); }}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">{renderView()}</main>

      <QuickCreateMenu
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
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

      {/* Focus picker modal */}
      <FocusPickerModal
        isOpen={showFocusPicker}
        userId={user?.id ?? ''}
        currentCount={focusItems.length}
        onClose={() => setShowFocusPicker(false)}
        onConfirm={handleFocusConfirm}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPlusClick={() => setShowQuickCreate(v => !v)}
        isPlusActive={showQuickCreate}
      />
    </div>
  );
};

export default Dashboard;
