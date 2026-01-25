import { Search, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { getAvatarBgClass, getAvatarTextClass } from '@/lib/colors';
import { PastelColor } from '@/types';

interface TopBarProps {
  activeTab: string;
  onProfileClick: () => void;
}

const tabsWithSearch = ['home'];

export function TopBar({ 
  activeTab, 
  onProfileClick,
}: TopBarProps) {
  const { searchQuery, setSearchQuery, settings } = useAppStore();
  const [showSearch, setShowSearch] = useState(false);

  const showSearchAndProfile = tabsWithSearch.includes(activeTab);

  // Don't render anything if not on a tab that shows search/profile
  if (!showSearchAndProfile) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-safe">
      <div className="px-4 h-12 flex items-center justify-end">
        {showSearch ? (
          <div className="flex-1 flex items-center gap-3 h-12">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
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
