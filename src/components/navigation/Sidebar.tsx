import React from 'react';
import { Home, Calendar, CheckSquare, FileText, Plus, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { NisaAssistant } from './NisaAssistant';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  isPlusActive?: boolean;
  onProfileClick: () => void;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  plusButtonRef?: React.RefObject<HTMLButtonElement>;
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
  isExpanded,
  onExpandedChange,
  plusButtonRef,
}: SidebarProps) {
  const { settings } = useAppStore();
  const isDark = settings.theme === 'dark';

  const todayGradient = 'linear-gradient(180deg, rgba(190, 140, 255, 0.25) 0%, rgba(220, 120, 200, 0.15) 60%, transparent 100%)';

  return (
    <nav
      className={cn(
        'fixed left-0 top-0 z-50 flex flex-col py-6',
        'transition-all duration-300 ease-in-out',
        isExpanded ? 'w-56 px-2' : 'w-16 px-0',
      )}
      style={{
        height: '100vh',
        background: isDark
          ? 'hsl(var(--sidebar-background))'
          : todayGradient,
        backdropFilter: isDark ? undefined : 'blur(12px)',
        WebkitBackdropFilter: isDark ? undefined : 'blur(12px)',
        borderRight: isDark
          ? '1px solid hsl(var(--sidebar-border))'
          : '1px solid rgba(200, 180, 220, 0.15)',
        borderRadius: '0 20px 20px 0',
        boxShadow: isDark ? 'none' : '4px 0 24px rgba(180, 150, 210, 0.08)',
      }}
    >
      {/* Logo / toggle */}
      <div className={cn('flex items-center mb-8 h-8', isExpanded ? 'justify-between px-3' : 'justify-center')}>
        <img
          src="/Planisa-logo.png"
          alt="Planisa"
          className={cn('h-6 w-auto transition-opacity duration-200 dark:brightness-0 dark:invert', isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden')}
        />
        <button
          onClick={() => onExpandedChange(!isExpanded)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/30 hover:text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex-shrink-0"
        >
          {isExpanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
      </div>

      {/* Plus button */}
      <div className={cn('flex items-center mb-8 w-full', isExpanded ? 'gap-3 px-3' : 'justify-center')}>
        <button
          onClick={onPlusClick}
          ref={plusButtonRef}
          className="w-8 h-8 rounded-full bg-[#1C1C1E] dark:bg-foreground flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4 text-white dark:text-background" />
        </button>
        {isExpanded && (
          <span className="text-sm font-medium text-foreground/60 whitespace-nowrap">New</span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 w-full">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'w-full h-11 flex items-center rounded-2xl transition-all duration-200 cursor-pointer',
                isExpanded ? 'gap-3 px-3' : 'justify-center',
                isActive
                  ? 'bg-[#ede8f5] md:bg-black/10 dark:bg-muted text-foreground md:text-[#2C2C2C] dark:text-foreground font-medium'
                  : 'text-foreground/40 hover:text-foreground/70 md:text-[#2C2C2C]/60 md:hover:text-[#2C2C2C]/90 dark:text-foreground/50 dark:hover:text-foreground',
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nisa */}
      <div className={cn(
        'transition-all duration-300 overflow-hidden px-3 mb-6',
        isExpanded ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0',
      )}>
        <NisaAssistant />
      </div>

      {/* Profile button */}
      <button
        onClick={onProfileClick}
        className={cn(
          'w-full h-11 flex items-center rounded-2xl transition-all duration-200 cursor-pointer',
          isExpanded ? 'gap-3 px-3' : 'justify-center',
          activeTab === 'profile'
            ? 'bg-[#ede8f5] md:bg-black/10 dark:bg-muted text-foreground md:text-[#2C2C2C] dark:text-foreground font-medium'
            : 'text-foreground/40 hover:text-foreground/70 md:text-[#2C2C2C]/60 md:hover:text-[#2C2C2C]/90 dark:text-foreground/50 dark:hover:text-foreground',
        )}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden"
          style={
            settings.avatarType === 'image' && settings.avatarUrl
              ? undefined
              : {
                  backgroundColor: isDark ? '#F5F3F0' : '#1C1C1E',
                  color: isDark ? '#1C1C1E' : '#FFFFFF',
                }
          }
        >
          {settings.avatarType === 'image' && settings.avatarUrl ? (
            <img src={settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : settings.avatarType === 'emoji' && settings.avatarEmoji ? (
            <span className="text-sm leading-none">{settings.avatarEmoji}</span>
          ) : (
            settings.avatarInitial || settings.name?.trim()?.[0]?.toUpperCase() || <User className="w-4 h-4" />
          )}
        </div>
        {isExpanded && (
          <span className="text-sm font-medium whitespace-nowrap">Profile</span>
        )}
      </button>
    </nav>
  );
}
