import React from 'react';
import { TabNavigation } from './TabNavigation';

interface PageLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onPlusClick: () => void;
  isPlusActive?: boolean;
  showNavigation?: boolean;
  className?: string;
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
}: PageLayoutProps) {
  return (
    <>
      {/* Content wrapper with fixed positioning for navbar */}
      <div className={`relative min-h-screen ${className}`}>
        {children}
      </div>

      {/* Navigation - always positioned at the bottom with safe area insets */}
      {showNavigation && (
        <TabNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          onPlusClick={onPlusClick}
          isPlusActive={isPlusActive}
        />
      )}
    </>
  );
}
