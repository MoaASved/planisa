import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { TabNavigation } from '../components/navigation/TabNavigation';
import { useAppStore } from '../store/useAppStore';
import { HomeView } from '../components/views/HomeView';
import { CalendarViewComponent } from '../components/views/CalendarView';
import { TasksView } from '../components/views/TasksView';
import { NotesView } from '../components/views/NotesView';
import { ProfileView } from '../components/views/ProfileView';
import { CreateEventModal } from '../components/modals/CreateEventModal';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { QuickCreateMenu } from '../components/QuickCreateMenu';
import { Search, Plus, Mic, Calendar, CheckSquare, FileText, Pin, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Habit {
  id: string;
  name: string;
  days: boolean[];
}

interface FocusItem {
  id: string;
  title: string;
  type: 'task' | 'event';
}

interface DashboardHomeProps {
  user: any;
  userName: string;
  focusItems: FocusItem[];
  setFocusItems: React.Dispatch<React.SetStateAction<FocusItem[]>>;
  brainDumpText: string;
  setBrainDumpText: React.Dispatch<React.SetStateAction<string>>;
  weekEvents: { [key: string]: number };
  showNisaBubble: boolean;
  setShowNisaBubble: React.Dispatch<React.SetStateAction<boolean>>;
  dismissNisaBubble: () => void;
  toggleNisaBubble: () => void;
  onProfileClick: () => void;
}

interface Habit {
  id: string;
  name: string;
  days: boolean[];
}

interface FocusItem {
  id: string;
  title: string;
  type: 'task' | 'event' | 'note' | 'sticky';
}

interface FocusPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: FocusItem) => void;
  currentFocusItems: FocusItem[];
}

const FocusPickerModal: React.FC<FocusPickerModalProps> = ({ isOpen, onClose, onSelect, currentFocusItems }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'events' | 'notes' | 'stickies'>('tasks');
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let data: any[] = [];

      switch (activeTab) {
        case 'tasks':
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', user?.id)
            .or(`due_date.eq.${today},due_date.is.null`)
            .neq('completed', true)
            .limit(20);
          data = tasks?.map(t => ({ id: t.id, title: t.title, type: 'task' as const })) || [];
          break;
        case 'events':
          const { data: events } = await supabase
            .from('events')
            .select('id, title')
            .eq('user_id', user?.id)
            .gte('start_time', `${today}T00:00:00`)
            .lt('start_time', `${today}T23:59:59`)
            .limit(20);
          data = events?.map(e => ({ id: e.id, title: e.title, type: 'event' as const })) || [];
          break;
        case 'notes':
          const { data: notes } = await supabase
            .from('notes')
            .select('id, title')
            .eq('user_id', user?.id)
            .limit(20);
          data = notes?.map(n => ({ id: n.id, title: n.title, type: 'note' as const })) || [];
          break;
        case 'stickies':
          // Assuming sticky notes are in notes table with a flag or separate table
          const { data: stickies } = await supabase
            .from('notes')
            .select('id, title')
            .eq('user_id', user?.id)
            .limit(20);
          data = stickies?.map(s => ({ id: s.id, title: s.title, type: 'sticky' as const })) || [];
          break;
      }
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (item: FocusItem) => currentFocusItems.some(f => f.id === item.id && f.type === item.type);
  const canSelect = currentFocusItems.length < 3;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-card rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flow-modal-title">Add Focus Item</h3>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex space-x-2 mb-4">
            {[
              { key: 'tasks', label: 'Tasks' },
              { key: 'events', label: 'Events' },
              { key: 'notes', label: 'Notes' },
              { key: 'stickies', label: 'Stickies' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-muted-foreground">No items found</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (canSelect && !isSelected(item)) {
                        onSelect(item);
                        onClose();
                      }
                    }}
                    disabled={!canSelect || isSelected(item)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-colors",
                      isSelected(item) ? "bg-primary/10 text-primary" : canSelect ? "bg-secondary hover:bg-secondary/80" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <p className="flow-body">{item.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {currentFocusItems.length}/3 focus items selected
          </p>
        </div>
      </div>
    </div>
  );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({
  user,
  userName,
  focusItems,
  setFocusItems,
  brainDumpText,
  setBrainDumpText,
  weekEvents,
  showNisaBubble,
  setShowNisaBubble,
  dismissNisaBubble,
  toggleNisaBubble,
  onProfileClick,
}) => {
  const [showFocusPicker, setShowFocusPicker] = useState(false);
  const [habits] = useState<Habit[]>([
    { id: '1', name: 'Drink water', days: [true, true, false, true, true, false, false] },
    { id: '2', name: 'Exercise', days: [false, true, true, false, true, true, false] },
    { id: '3', name: 'Read', days: [true, false, true, true, false, true, true] },
  ]);

  const addFocusItem = () => {
    if (focusItems.length < 3) {
      setShowFocusPicker(true);
    }
  };

  const handleFocusSelect = (item: FocusItem) => {
    const newFocus = [...focusItems, item];
    setFocusItems(newFocus);
    localStorage.setItem('dashboard_focus', JSON.stringify(newFocus));
  };

  const handleBrainDumpSort = (type: 'event' | 'task' | 'note' | 'sticky') => {
    if (!brainDumpText.trim()) return;

    // For now, just show a toast. In a real app, navigate to create flow with pre-filled text
    toast.success(`Creating ${type} with: "${brainDumpText}"`);
    setBrainDumpText('');
  };

  const handleVoiceButton = () => {
    toast.info('Voice feature coming soon!');
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <div className="bg-background pb-24 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="flow-page-title">
              Hi, {userName} 👋
            </h1>
            <p className="flow-meta mt-1">{todayString}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Search className="w-6 h-6 text-muted-foreground" />
            <button
              onClick={onProfileClick}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/60"
              aria-label="Open profile settings"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Focus today */}
        <div className="bg-[#1C1C1E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flow-section-title text-white">Focus today</h2>
            <button
              onClick={addFocusItem}
              disabled={focusItems.length >= 3}
              className="text-purple-400 text-sm flex items-center space-x-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>add focus</span>
            </button>
          </div>
          <div className="space-y-3">
            {focusItems.map((item, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3">
                <p className="text-white flow-body">{item.title}</p>
              </div>
            ))}
            {focusItems.length === 0 && (
              <p className="text-gray-400 text-sm">No focus today</p>
            )}
          </div>
        </div>

        {/* Brain dump */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">Brain dump</h2>
          <textarea
            value={brainDumpText}
            onChange={(e) => setBrainDumpText(e.target.value)}
            placeholder="Write anything... sort later."
            className="w-full h-24 p-3 bg-secondary border-0 rounded-xl resize-none mb-4 flow-input"
          />
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={handleVoiceButton}>
              <Mic className="w-5 h-5" />
              <span className="flow-meta">Voice</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('event')}>
              <Calendar className="w-5 h-5" />
              <span className="flow-meta">Event</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('task')}>
              <CheckSquare className="w-5 h-5" />
              <span className="flow-meta">Task</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('note')}>
              <FileText className="w-5 h-5" />
              <span className="flow-meta">Note</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground" onClick={() => handleBrainDumpSort('sticky')}>
              <Pin className="w-5 h-5" />
              <span className="flow-meta">Sticky</span>
            </button>
          </div>
        </div>

        {/* Habits */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">Habits</h2>
          <div className="space-y-4">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between">
                <span className="flow-body">{habit.name}</span>
                <div className="flex space-x-1">
                  {habit.days.map((done, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        done ? 'bg-[#9674cc]' : 'border border-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Den här veckan */}
        <div className="flow-widget">
          <h2 className="flow-section-title mb-4">This week</h2>
          <div className="flex justify-between">
            {weekDays.map((day, index) => (
              <div key={day} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    index === todayIndex ? 'bg-[#1C1C1E] text-white' : 'text-muted-foreground'
                  }`}
                >
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

      {/* Nisa floating popup */}
      <div className="fixed bottom-28 left-4 z-50">
        <div
          onClick={toggleNisaBubble}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-lg shadow-lg transform -rotate-12 relative cursor-pointer"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
        </div>
        {showNisaBubble && (
          <div className="relative mt-2">
            <button
              onClick={dismissNisaBubble}
              className="absolute -top-2 right-2 text-xs text-muted-foreground hover:text-foreground"
            >
              dismiss for today
            </button>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-card max-w-xs">
              <p className="flow-body text-sm">
                Hi! I'm Nisa, your AI assistant. How can I help you today?
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { settings, setHighlightTaskId } = useAppStore();
  const [activeTab, setActiveTabRaw] = useState('home');
  const [userName, setUserName] = useState('');
  const [focusItems, setFocusItems] = useState<FocusItem[]>([]);
  const [brainDumpText, setBrainDumpText] = useState('');
  // const [habits, setHabits] = useState<Habit[]>([]);
  const [weekEvents, setWeekEvents] = useState<{ [key: string]: number }>({});
  const [showNisaBubble, setShowNisaBubble] = useState(true);

  // Quick create menu state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  
  // Task creation state
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [defaultTaskDate, setDefaultTaskDate] = useState<Date | undefined>(undefined);
  const [showCalendarTaskCreate, setShowCalendarTaskCreate] = useState(false);

  const setActiveTab = (tab: string) => {
    setActiveTabRaw(tab);
  };

  useEffect(() => {
    if (user) {
      // Get user name from settings or email
      const name = settings.name?.trim() || user.email?.split('@')[0] || 'Användare';
      setUserName(name.split(' ')[0]); // Only first name

      // Load focus items from localStorage
      const savedFocus = localStorage.getItem('dashboard_focus');
      if (savedFocus) {
        setFocusItems(JSON.parse(savedFocus));
      }

      // Check if Nisa bubble was dismissed today
      const dismissedToday = localStorage.getItem(`nisa_dismissed_${new Date().toDateString()}`);
      setShowNisaBubble(!dismissedToday);

      // Load habits
      // fetchHabits();

      // Load week events
      fetchWeekEvents();
    }
  }, [user, settings.name]);

  // Apply theme on mount and when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', '#0d1117');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', '#faf9f7');
    }
  }, [settings.theme]);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const handlePlusClick = () => {
    setShowQuickCreate(!showQuickCreate);
  };

  const handleCreateTask = () => {
    if (activeTab === 'calendar') {
      setShowCalendarTaskCreate(true);
    } else {
      setIsCreatingNewTask(true);
      setDefaultTaskDate(undefined);
      setActiveTab('tasks');
    }
  };

  const handleCreateEvent = () => {
    setShowCalendarTaskCreate(false); // Close task modal if open
    setShowEventModal(true);
  };

  const handleCreateNote = () => {
    setIsCreatingNewNote(true);
    setIsCreatingStickyNote(false);
    setIsEditingNote(true);
    setActiveTab('notes');
  };

  const handleCreateStickyNote = () => {
    setIsCreatingStickyNote(true);
    setIsCreatingNewNote(true);
    setIsEditingNote(true);
    setActiveTab('notes');
  };

  const handleCloseNoteEditor = () => {
    setIsCreatingNewNote(false);
    setIsCreatingStickyNote(false);
    setIsEditingNote(false);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome 
          user={user}
          userName={userName} 
          focusItems={focusItems} 
          setFocusItems={setFocusItems}
          brainDumpText={brainDumpText}
          setBrainDumpText={setBrainDumpText}
          weekEvents={weekEvents}
          showNisaBubble={showNisaBubble}
          setShowNisaBubble={setShowNisaBubble}
          dismissNisaBubble={dismissNisaBubble}
          toggleNisaBubble={toggleNisaBubble}
          onProfileClick={() => setActiveTab('profile')}
        />;
      case 'calendar':
        return <CalendarViewComponent onDateChange={setSelectedCalendarDate} onNavigateToTasks={(task) => { setHighlightTaskId(task.id); setActiveTab('tasks'); }} />;
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
            onCloseNoteEditor={handleCloseNoteEditor}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardHome 
          user={user}
          userName={userName} 
          focusItems={focusItems} 
          setFocusItems={setFocusItems}
          brainDumpText={brainDumpText}
          setBrainDumpText={setBrainDumpText}
          weekEvents={weekEvents}
          showNisaBubble={showNisaBubble}
          setShowNisaBubble={setShowNisaBubble}
          dismissNisaBubble={dismissNisaBubble}
          toggleNisaBubble={toggleNisaBubble}
        />;
    }
  };

  // const fetchHabits = async () => {
  //   // Assuming habits table exists
  //   const { data, error } = await supabase
  //     .from('habits')
  //     .select('*')
  //     .eq('user_id', user?.id);

  //   if (data && !error) {
  //     setHabits(data.map(habit => ({
  //       id: habit.id,
  //       name: habit.name,
  //       days: habit.days || [false, false, false, false, false, false, false]
  //     })));
  //   }
  // };

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
      const eventCounts: { [key: string]: number } = {};
      data.forEach(event => {
        const day = new Date(event.start_time).getDay();
        const adjustedDay = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
        eventCounts[adjustedDay] = (eventCounts[adjustedDay] || 0) + 1;
      });
      setWeekEvents(eventCounts);
    }
  };

  const addFocusItem = async () => {
    // Fetch tasks and events for picker
    const [tasksRes, eventsRes] = await Promise.all([
      supabase.from('tasks').select('id, title').eq('user_id', user?.id).limit(10),
      supabase.from('events').select('id, title').eq('user_id', user?.id).limit(10)
    ]);

    const items = [
      ...(tasksRes.data?.map(t => ({ id: t.id, title: t.title, type: 'task' as const })) || []),
      ...(eventsRes.data?.map(e => ({ id: e.id, title: e.title, type: 'event' as const })) || [])
    ];

    // For now, just add the first item as example. In real app, show picker modal
    if (items.length > 0 && focusItems.length < 3) {
      const newFocus = [...focusItems, items[0]];
      setFocusItems(newFocus);
      localStorage.setItem('dashboard_focus', JSON.stringify(newFocus));
    }
  };

  const dismissNisaBubble = () => {
    setShowNisaBubble(false);
    localStorage.setItem(`nisa_dismissed_${new Date().toDateString()}`, 'true');
  };

  const toggleNisaBubble = () => {
    setShowNisaBubble(!showNisaBubble);
  };

  const today = new Date();
  const todayString = today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return (
    <>
      {renderView()}

      {/* Quick Create Menu */}
      <QuickCreateMenu
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onCreateTask={handleCreateTask}
        onCreateEvent={handleCreateEvent}
        onCreateNote={handleCreateNote}
        onCreateStickyNote={handleCreateStickyNote}
      />

      {/* Modals */}
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} initialDate={selectedCalendarDate} />
      <AddTaskModal isOpen={showCalendarTaskCreate} onClose={() => setShowCalendarTaskCreate(false)} defaultDate={selectedCalendarDate} />

      {/* Bottom navbar */}
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPlusClick={handlePlusClick}
        isPlusActive={showQuickCreate}
      />
    </>
  );
};

export default Dashboard;