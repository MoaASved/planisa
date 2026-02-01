import { useState, useEffect } from 'react';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { TopBar } from '@/components/navigation/TopBar';
import { QuickCreateMenu } from '@/components/QuickCreateMenu';
import { HomeView } from '@/components/views/HomeView';
import { CalendarViewComponent } from '@/components/views/CalendarView';
import { TasksView } from '@/components/views/TasksView';
import { NotesView } from '@/components/views/NotesView';
import { ProfileView } from '@/components/views/ProfileView';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const { settings } = useAppStore();

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [isCreatingStickyNote, setIsCreatingStickyNote] = useState(false);
  
  // Task creation state
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);

  // Apply theme on mount and when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', '#0d1117');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', '#f7f9fc');
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
    setIsCreatingNewTask(true);
    setActiveTab('tasks');
  };

  const handleCreateEvent = () => {
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
        return <HomeView onNavigate={setActiveTab} />;
      case 'calendar':
        return <CalendarViewComponent />;
      case 'tasks':
        return (
          <TasksView 
            isCreatingNewTask={isCreatingNewTask}
            onCreatingTaskComplete={() => setIsCreatingNewTask(false)}
          />
        );
      case 'notes':
        return (
          <NotesView 
            onEditingChange={setIsEditingNote}
            isCreatingNew={isCreatingNewNote}
            isCreatingStickyNote={isCreatingStickyNote}
            onCloseEditor={handleCloseNoteEditor}
          />
        );
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView onNavigate={setActiveTab} />;
    }
  };

  // Hide TopBar when editing notes, on calendar, or on notes/tasks (they don't have search/profile anymore)
  const showTopBar = !isEditingNote && activeTab === 'home';
  const showNavigation = !isEditingNote;

  // Determine top padding based on active tab
  const getMainPadding = () => {
    if (!showNavigation) return 'pt-0'; // Editing note
    if (activeTab === 'calendar') return 'pt-0'; // Calendar has its own header
    if (activeTab === 'home') return 'pt-14'; // Home has TopBar
    return 'pt-safe'; // Notes and Tasks - just safe area, content starts higher
  };

  return (
    <div className="min-h-screen bg-background">
      {showTopBar && (
        <TopBar 
          activeTab={activeTab} 
          onProfileClick={() => setActiveTab('profile')}
        />
      )}
      
      <main className={cn("pb-24", getMainPadding())}>
        {renderView()}
      </main>
      
      {showNavigation && (
        <>
          <QuickCreateMenu
            isOpen={showQuickCreate}
            onClose={() => setShowQuickCreate(false)}
            onCreateTask={handleCreateTask}
            onCreateEvent={handleCreateEvent}
            onCreateNote={handleCreateNote}
            onCreateStickyNote={handleCreateStickyNote}
          />
          
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            onPlusClick={handlePlusClick}
            isPlusActive={showQuickCreate}
          />
        </>
      )}

      {/* Modals */}
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
    </div>
  );
};

export default Index;
