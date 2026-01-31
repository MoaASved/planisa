/**
 * useHaptics - Premium haptic feedback for mobile interactions
 * Provides tactile feedback that makes the app feel polished and responsive
 */

type HapticType = 'micro' | 'light' | 'medium' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticType, number | number[]> = {
  micro: 5,      // Tab change, hover feedback
  light: 10,     // Checkbox toggle, button press
  medium: 20,    // Swipe threshold reached
  success: 30,   // Task completed, item created
  warning: [20, 50, 20], // Important action
  error: 50,     // Delete, destructive action
};

export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = (type: HapticType = 'light') => {
    if (!isSupported) return;
    
    try {
      navigator.vibrate(hapticPatterns[type]);
    } catch {
      // Silently fail if vibration not allowed
    }
  };

  return {
    trigger,
    isSupported,
    // Convenience methods
    micro: () => trigger('micro'),
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
  };
}
