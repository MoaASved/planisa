import { Home, Calendar, CheckSquare, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flow-nav-pill z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all duration-300',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon 
              className={cn(
                'w-5 h-5 transition-all duration-200',
                isActive ? 'scale-110' : 'scale-100'
              )} 
            />
            <span className={cn(
              'text-[10px] font-medium transition-all duration-200',
              isActive ? 'opacity-100' : 'opacity-70'
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}