import { Home, Calendar, CheckSquare, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  isPlusActive?: boolean;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'plus', label: '', icon: Plus, isCenter: true },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
];

export function TabNavigation({ activeTab, onTabChange, onPlusClick, isPlusActive }: TabNavigationProps) {
  return (
    <nav className="flow-nav-pill safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={onPlusClick}
              className="flow-nav-center"
            >
              <Icon className={cn(
                "w-6 h-6 transition-transform duration-200",
                isPlusActive && "rotate-45"
              )} />
            </button>
          );
        }
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flow-nav-item',
              isActive && 'flow-nav-item-active'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}