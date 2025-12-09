import { Search, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { getAvatarBgClass, getAvatarTextClass } from '@/lib/colors';
import { CalendarView, PastelColor } from '@/types';
import { ViewSelector } from '@/components/calendar/ViewSelector';

interface TopBarProps {
  activeTab: string;
  onProfileClick: () => void;
  // Calendar-specific props
  calendarView?: CalendarView;
  onCalendarViewChange?: (view: CalendarView) => void;
  currentMonth?: string;
  onMonthClick?: () => void;
}

const tabTitles: Record<string, string> = {
  home: 'home',
  calendar: 'calendar',
  tasks: 'tasks',
  notes: 'notes',
  profile: 'profile',
};

export function TopBar({ 
  activeTab, 
  onProfileClick,
  calendarView,
  onCalendarViewChange,
  currentMonth,
  onMonthClick,
}: TopBarProps) {
  const { searchQuery, setSearchQuery, settings } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);

  const isCalendarTab = activeTab === 'calendar';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-safe">
      <div className={cn(
        "px-4",
        isCalendarTab ? "py-2" : "h-12 flex items-center justify-end"
      )}>
        {showSearch ? (
          <div className="flex-1 flex items-center gap-3 h-12">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tabTitles[activeTab]}...`}
              className="flex-1 bg-secondary/80 backdrop-blur-sm rounded-full px-4 py-2 text-sm outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="text-sm font-medium text-primary"
            >
              Cancel
            </button>
          </div>
        ) : isCalendarTab && calendarView && onCalendarViewChange && currentMonth ? (
          // Calendar header with month and view selector
          <div className="flex flex-col gap-2">
            {/* Top row: month name + search/profile */}
            <div className="flex items-center justify-between">
              <button 
                onClick={onMonthClick}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <span className="text-lg font-semibold text-foreground">
                  {currentMonth}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-9 h-9 rounded-full bg-secondary/60 backdrop-blur-sm flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Search className="w-[18px] h-[18px] text-foreground/70" />
                </button>
                
                <button
                  onClick={onProfileClick}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                    settings.avatarColor 
                      ? `${getAvatarBgClass(settings.avatarColor as PastelColor)} ${getAvatarTextClass(settings.avatarColor as PastelColor)}` 
                      : 'bg-secondary/60 backdrop-blur-sm text-foreground/70'
                  )}
                >
                  {settings.avatarInitial || <User className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* View selector row */}
            <ViewSelector view={calendarView} onViewChange={onCalendarViewChange} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="w-9 h-9 rounded-full bg-secondary/60 backdrop-blur-sm flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Search className="w-[18px] h-[18px] text-foreground/70" />
            </button>
            
            <button
              onClick={onProfileClick}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                settings.avatarColor 
                  ? `${getAvatarBgClass(settings.avatarColor as PastelColor)} ${getAvatarTextClass(settings.avatarColor as PastelColor)}` 
                  : 'bg-secondary/60 backdrop-blur-sm text-foreground/70'
              )}
            >
              {settings.avatarInitial || <User className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
