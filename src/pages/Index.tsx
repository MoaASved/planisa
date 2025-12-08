import { useState, useEffect } from 'react';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { TopBar } from '@/components/navigation/TopBar';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { HomeView } from '@/components/views/HomeView';
import { CalendarViewComponent } from '@/components/views/CalendarView';
import { TasksView } from '@/components/views/TasksView';
import { NotesView } from '@/components/views/NotesView';
import { ProfileView } from '@/components/views/ProfileView';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { CreateNoteModal } from '@/components/modals/CreateNoteModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const { settings } = useAppStore();

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
        setShowNoteModal(true);
        break;
      case 'calendar':
        setShowEventModal(true);
        break;
      default:
        // On home, show action sheet with options (handled by FAB component)
        break;
    }
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
        return <NotesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        activeTab={activeTab} 
        onProfileClick={() => setActiveTab('profile')} 
      />
      
      <main className="pt-16 pb-24">
        {renderView()}
      </main>
      
      <FloatingActionButton
        activeTab={activeTab}
        onCreateTask={() => setShowTaskModal(true)}
        onCreateNote={() => setShowNoteModal(true)}
        onCreateEvent={() => setShowEventModal(true)}
      />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onPlusClick={handleFabClick}
      />

      {/* Modals */}
      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <CreateNoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} />
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
    </div>
  );
};

export default Index;