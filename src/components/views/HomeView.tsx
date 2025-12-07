import { format } from 'date-fns';
import { Header } from '@/components/navigation/Header';
import { MiniCalendarWidget } from '@/components/widgets/MiniCalendarWidget';
import { TodayTasksWidget } from '@/components/widgets/TodayTasksWidget';
import { TodayEventsWidget } from '@/components/widgets/TodayEventsWidget';
import { QuickAddWidget } from '@/components/widgets/QuickAddWidget';
import { useAppStore } from '@/store/useAppStore';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const { tasks, events } = useAppStore();

  const todayDate = format(new Date(), 'EEEE, MMMM d');
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const handleQuickAdd = (type: 'task' | 'event' | 'note') => {
    if (type === 'task') onNavigate('tasks');
    else if (type === 'event') onNavigate('calendar');
    else onNavigate('notes');
  };

  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="Good morning" 
        subtitle={`${todayDate} • ${pendingTasks} tasks pending`} 
      />

      <main className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <MiniCalendarWidget />
          <TodayTasksWidget />
          <TodayEventsWidget />
          <QuickAddWidget onQuickAdd={handleQuickAdd} />
        </div>

        {/* Progress Summary */}
        <div className="flow-card mt-4 animate-fade-up stagger-4">
          <h3 className="font-semibold text-foreground mb-3">Weekly Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{tasks.filter(t => t.completed).length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-flow-amber">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-flow-mint">{events.length}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Task completion</span>
              <span className="text-xs font-medium text-primary">
                {tasks.length > 0 
                  ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ 
                  width: `${tasks.length > 0 
                    ? (tasks.filter(t => t.completed).length / tasks.length) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
