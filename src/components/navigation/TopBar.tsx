import { Search, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface TopBarProps {
  activeTab: string;
  onProfileClick: () => void;
}

const tabTitles: Record<string, string> = {
  home: 'Flow Planner',
  calendar: 'Calendar',
  tasks: 'Tasks',
  notes: 'Notes',
  profile: 'Profile',
};

export function TopBar({ activeTab, onProfileClick }: TopBarProps) {
  const { searchQuery, setSearchQuery, settings } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {showSearch ? (
          <div className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tabTitles[activeTab].toLowerCase()}...`}
              className="flex-1 bg-secondary rounded-xl px-4 py-2 text-sm outline-none"
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
        ) : (
          <>
            <h1 className="text-lg font-semibold text-foreground">
              {tabTitles[activeTab]}
            </h1>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button
                onClick={onProfileClick}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  settings.avatarColor 
                    ? `bg-pastel-${settings.avatarColor}/30 text-pastel-${settings.avatarColor}` 
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {settings.avatarInitial || <User className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}