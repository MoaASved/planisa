import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function AnimatedCheckbox({ checked, onChange, className }: AnimatedCheckboxProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    if (checked) {
      setIsCompleting(true);
      const timer = setTimeout(() => setIsCompleting(false), 500);
      return () => clearTimeout(timer);
    }
  }, [checked]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.success();
    onChange();
  };

  return (
    <div 
      className={cn(
        'checkbox-animated',
        isCompleting && 'completing',
        checked && 'checked',
        className
      )}
    >
      {/* Completion ring effect */}
      <div className="completion-ring" />
      
      <button
        onClick={handleClick}
        className={cn(
          'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0',
          checked 
            ? 'bg-primary border-primary' 
            : 'border-muted-foreground hover:border-primary'
        )}
      >
        {checked && (
          <svg 
            className="w-4 h-4 text-primary-foreground" 
            viewBox="0 0 16 16" 
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path 
              className="checkmark-svg"
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
