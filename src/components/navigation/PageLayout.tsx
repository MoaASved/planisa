import React from 'react';
import { TabNavigation } from './TabNavigation';
import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  isPlusActive?: boolean;
  showNavigation?: boolean;
  className?: string;
  onProfileClick?: () => void;
}

/**
 * Consistent page layout wrapper
 * Ensures the bottom navbar renders at the same height/position across all pages
 * Handles proper scrolling and spacing to prevent content from being hidden behind the navbar
 */
export function PageLayout({
  children,
  activeTab,
  onTabChange,
  onPlusClick,
  isPlusActive = false,
  showNavigation = true,
  className = '',
  onProfileClick = () => {},
}: PageLayoutProps) {
  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onPlusClick={onPlusClick}
          onProfileClick={onProfileClick}
        />
      </div>

      {/* Content wrapper - offset on desktop to account for sidebar */}
      <div className={`relative min-h-screen md:pl-16 ${className}`}>
        {children}
      </div>

      {/* Bottom nav - mobile only */}
      {showNavigation && (
        <div className="md:hidden">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={onTabChange}
            onPlusClick={onPlusClick}
            isPlusActive={isPlusActive}
          />
        </div>
      )}
    </>
  );
}
