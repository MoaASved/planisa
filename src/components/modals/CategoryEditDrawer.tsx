import { useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pastelColors } from '@/lib/colors';
import { PastelColor } from '@/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface CategoryEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  itemColor: PastelColor;
  onNameChange: (name: string) => void;
  onColorChange: (color: PastelColor) => void;
  onSave: () => void;
  onDelete?: () => void;
  placeholder?: string;
  saveLabel?: string;
  showDelete?: boolean;
}

export function CategoryEditDrawer({
  isOpen,
  onClose,
  title,
  itemName,
  itemColor,
  onNameChange,
  onColorChange,
  onSave,
  onDelete,
  placeholder = 'Enter name',
  saveLabel = 'Save Changes',
  showDelete = false,
}: CategoryEditDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure drawer is open before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      // Check if viewport height decreased significantly (keyboard opened)
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setKeyboardVisible(viewportHeight < windowHeight * 0.8);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleSave = () => {
    if (itemName.trim()) {
      onSave();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-2">
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-4">
              <div className={cn('w-6 h-6 rounded-full', `bg-pastel-${itemColor}`)} />
              <span className="font-medium text-foreground">
                {itemName || placeholder}
              </span>
            </div>

            {/* Name Input */}
            <input
              ref={inputRef}
              type="text"
              value={itemName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={placeholder}
              className="flow-input mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />

            {/* Color Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {pastelColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onColorChange(c.value)}
                    className={cn(
                      'w-10 h-10 rounded-xl transition-all duration-200',
                      c.class,
                      itemColor === c.value 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    )}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter className={cn(
            "pt-2 gap-2",
            keyboardVisible && "pb-4"
          )}>
            {showDelete && onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-medium transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!itemName.trim()}
              className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
