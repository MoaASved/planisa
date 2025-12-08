import { useState } from 'react';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { HomeView } from '@/components/views/HomeView';
import { CalendarViewComponent } from '@/components/views/CalendarView';
import { TasksView } from '@/components/views/TasksView';
import { NotesView } from '@/components/views/NotesView';
import { ProfileView } from '@/components/views/ProfileView';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { CreateNoteModal } from '@/components/modals/CreateNoteModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onNavigate={setActiveTab} />;
      case 'calendar':
        return <CalendarViewComponent />;
      case 'tasks':
        return <TasksView />;
      case 'notes':
        return <NotesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderView()}
      
      <FloatingActionButton
        onCreateTask={() => setShowTaskModal(true)}
        onCreateNote={() => setShowNoteModal(true)}
        onCreateEvent={() => setShowEventModal(true)}
      />
      
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <CreateTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <CreateNoteModal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} />
      <CreateEventModal isOpen={showEventModal} onClose={() => setShowEventModal(false)} />
    </div>
  );
};

export default Index;