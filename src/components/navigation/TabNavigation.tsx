import { Home, Calendar, CheckSquare, FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

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
{ id: 'notes', label: 'Notes', icon: FileText }];


export function TabNavigation({ activeTab, onTabChange, onPlusClick, isPlusActive }: TabNavigationProps) {
  const haptics = useHaptics();
  return (
    <nav className="flow-nav-floating safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.medium();
                onPlusClick();
              }}
              className="flow-nav-center-btn transition-transform duration-200 active:scale-90 my-[10px]">

              <Icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                isPlusActive && "rotate-45"
              )} />
            </button>);

        }

        return (
          <button
            key={tab.id}
            onClick={() => {
              haptics.micro();
              onTabChange(tab.id);
            }}
            className={cn(
              'flow-nav-icon transition-all duration-200 active:scale-90',
              isActive && 'flow-nav-icon-active'
            )}>

            <Icon className="w-[22px] h-[22px]" />
          </button>);

      })}
    </nav>);

}