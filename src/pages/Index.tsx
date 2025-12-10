import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { TopBar } from '@/components/navigation/TopBar';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { HomeView } from '@/components/views/HomeView';
import { CalendarViewComponent } from '@/components/views/CalendarView';
import { TasksView } from '@/components/views/TasksView';
import { NotesView } from '@/components/views/NotesView';
import { ProfileView } from '@/components/views/ProfileView';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { useAppStore } from '@/store/useAppStore';
import { CalendarView } from '@/types';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const { settings } = useAppStore();

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);

  // Calendar state lifted to Index for TopBar integration
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showYearView, setShowYearView] = useState(false);

  // Apply theme on mount and when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleFabClick = () => {
    // Context-aware: open appropriate modal based on current tab
    switch (activeTab) {
      case 'tasks':
        setShowTaskModal(true);
        break;
      case 'notes':
        // Open NoteEditor directly for new note
        setIsCreatingNewNote(true);
        setIsEditingNote(true);
        break;
      case 'calendar':
        setShowEventModal(true);
        break;
      default:
        // On home, show action sheet with options (handled by FAB component)
        break;
    }
  };

  const handleCreateNote = () => {
    setIsCreatingNewNote(true);
    setIsEditingNote(true);
  };

  const handleCloseNoteEditor = () => {
    setIsCreatingNewNote(false);
    setIsEditingNote(false);
  };

  const handleMonthClick = () => {
    setShowYearView(true);
  };

  const handleCalendarViewChange = (view: CalendarView) => {
    setCalendarView(view);
    setShowYearView(false);
  };

  const getCurrentMonth = () => {
    return format(calendarDate, 'MMMM yyyy');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'calendar':
        return (
          <CalendarViewComponent 
            view={showYearView ? 'year' : calendarView}
            onViewChange={handleCalendarViewChange}
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            onExitYearView={() => setShowYearView(false)}
          />
        );
      case 'tasks':
        return <TasksView />;
      case 'notes':
        return (
          <NotesView 
            onEditingChange={setIsEditingNote}
            isCreatingNew={isCreatingNewNote}
            onCloseEditor={handleCloseNoteEditor}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  // Hide TopBar and navigation when editing notes
  const showNavigation = !isEditingNote;

  return (
    <div className="min-h-screen bg-background">
      {showNavigation && (
        <TopBar 
          activeTab={activeTab} 
          onProfileClick={() => setActiveTab('profile')}
          calendarView={calendarView}
          onCalendarViewChange={handleCalendarViewChange}
          currentMonth={getCurrentMonth()}
          onMonthClick={handleMonthClick}
        />
      )}
      
      <main className={cn(
        "pb-24",
        showNavigation && (activeTab === 'calendar' ? "pt-[88px]" : "pt-14"),
        !showNavigation && "pt-0"
      )}>
        {renderView()}
      </main>
      
      {showNavigation && (
        <>
          <FloatingActionButton
            activeTab={activeTab}
            onCreateTask={() => setShowTaskModal(true)}
            onCreateNote={handleCreateNote}
            onCreateEvent={() => setShowEventModal(true)}
          />
          
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            onPlusClick={handleFabClick}
          />
        </>
      )}

      {/* Modals */}
      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
    </div>
  );
};

export default Index;
