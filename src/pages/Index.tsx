import { useState, useEffect } from 'react';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { TopBar } from '@/components/navigation/TopBar';
import { FloatingActionButton } from '@/components/FloatingActionButton';
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
  const { settings } = useAppStore();

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);

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
        // Tasks now use inline creation, so just navigate to tasks tab
        setActiveTab('tasks');
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

  const handleCreateTask = () => {
    // Navigate to tasks view where inline creation is available
    setActiveTab('tasks');
  };

  const handleCreateNote = () => {
    setIsCreatingNewNote(true);
    setIsEditingNote(true);
  };

  const handleCloseNoteEditor = () => {
    setIsCreatingNewNote(false);
    setIsEditingNote(false);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'calendar':
        return <CalendarViewComponent />;
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

  // Hide TopBar and navigation when editing notes or on calendar (calendar has its own header)
  const showTopBar = !isEditingNote && activeTab !== 'calendar';
  const showNavigation = !isEditingNote;

  return (
    <div className="min-h-screen bg-background">
      {showTopBar && (
        <TopBar 
          activeTab={activeTab} 
          onProfileClick={() => setActiveTab('profile')}
        />
      )}
      
      <main className={cn(
        "pb-24",
        showTopBar && "pt-14",
        !showTopBar && activeTab === 'calendar' && "pt-0",
        !showTopBar && activeTab !== 'calendar' && "pt-0"
      )}>
        {renderView()}
      </main>
      
      {showNavigation && (
        <>
          <FloatingActionButton
            activeTab={activeTab}
            onCreateTask={handleCreateTask}
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
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
    </div>
  );
};

export default Index;
