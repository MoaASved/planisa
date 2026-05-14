import { useState } from 'react';
import { Home, Calendar, CheckSquare, FileText, Plus, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { getAccentTextClass } from '@/lib/colors';
import { PastelColor } from '@/types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  isPlusActive?: boolean;
  onProfileClick: () => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
];

export function Sidebar({
  activeTab,
  onTabChange,
  onPlusClick,
  onProfileClick,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { settings } = useAppStore();

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 z-50 flex flex-col py-6 px-2',
        'transition-all duration-300 ease-in-out',
        isExpanded ? 'w-56' : 'w-16',
      )}
      style={{
        height: '100vh',
        background: 'linear-gradient(160deg, rgba(229, 204, 255, 0.35) 0%, rgba(255, 218, 204, 0.25) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(200, 180, 220, 0.15)',
        borderRadius: '0 20px 20px 0',
        boxShadow: '4px 0 24px rgba(180, 150, 210, 0.08)',
      }}
    >
      {/* Logo */}
      <div className={cn('flex items-center mb-8 h-8 px-1', isExpanded ? 'justify-between' : 'justify-center')}>
        {isExpanded && (
          <>
            <div className="w-8 h-8 rounded-full bg-[#1C1C1E] flex-shrink-0" />
            <span className="font-semibold text-foreground whitespace-nowrap flex-1 ml-3">
              Planisa
            </span>
          </>
        )}
        <button
          onClick={() => setIsExpanded(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/30 hover:text-foreground/60 hover:bg-black/5 transition-all flex-shrink-0"
        >
          {isExpanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
      </div>

      {/* Plus button */}
      <div className="flex items-center px-1 mb-6">
        <button
          onClick={onPlusClick}
          className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:opacity-80"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
        <span
          className={cn(
            'text-sm font-medium text-white whitespace-nowrap transition-opacity duration-200 delay-100 ml-3',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
          )}
        >
          New
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'w-full h-11 flex items-center gap-3 px-3 rounded-2xl transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-[#ede8f5] text-foreground font-medium'
                  : 'text-foreground/40 hover:text-foreground/70',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap transition-opacity duration-200 delay-100',
                  isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile button */}
      <button
        onClick={onProfileClick}
        className={cn(
          'w-full h-11 flex items-center gap-3 px-3 rounded-2xl transition-all duration-200 cursor-pointer',
          activeTab === 'profile'
            ? 'bg-[#ede8f5] text-foreground font-medium'
            : 'text-foreground/40 hover:text-foreground/70',
        )}
      >
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
            settings.avatarColor
              ? getAccentTextClass(settings.avatarColor as PastelColor)
              : '',
          )}
          style={
            settings.avatarColor
              ? { backgroundColor: `hsl(var(--pastel-${settings.avatarColor}) / 0.3)` }
              : undefined
          }
        >
          {settings.avatarInitial || settings.name?.trim()?.[0]?.toUpperCase() || (
            <User className="w-4 h-4" />
          )}
        </div>
        <span
          className={cn(
            'text-sm font-medium whitespace-nowrap transition-opacity duration-200 delay-100',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
          )}
        >
          Profile
        </span>
      </button>
    </nav>
  );
}
