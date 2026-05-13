import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pastelColors } from '@/lib/colors';
import { PastelColor } from '@/types';
import { useVisualViewport } from '@/hooks/useVisualViewport';

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
  hideNameInput?: boolean;
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
  hideNameInput = false,
}: CategoryEditDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { modalTop, maxHeight } = useVisualViewport(70);

  useEffect(() => {
    if (isOpen && !hideNameInput) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hideNameInput]);

  const handleSave = () => {
    if (hideNameInput || itemName.trim()) onSave();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: modalTop,
          left: 0,
          right: 0,
          zIndex: 9999,
          padding: '0 20px',
        }}
      >
        <div
          className="bg-card rounded-3xl shadow-2xl animate-scale-in"
          style={{ maxHeight, overflowY: 'auto' }}
        >
          {/* Sticky header */}
          <div className="sticky top-0 bg-card rounded-t-3xl flex items-center justify-between px-5 pt-5 pb-3 z-10">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-5 pb-5">
            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-4">
              <div className={cn('w-6 h-6 rounded-full flex-shrink-0', `bg-pastel-${itemColor}`)} />
              <span className="font-medium text-foreground truncate">
                {itemName || placeholder}
              </span>
            </div>

            {/* Name input */}
            {!hideNameInput && (
              <input
                ref={inputRef}
                type="text"
                value={itemName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={placeholder}
                className="flow-input mb-4 w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            )}

            {/* Color picker */}
            <p className="text-sm font-medium text-muted-foreground mb-2">Color</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {pastelColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onColorChange(c.value)}
                  className={cn(
                    'w-10 h-10 rounded-xl transition-all duration-200',
                    c.class,
                    itemColor === c.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105',
                  )}
                  aria-label={c.label}
                />
              ))}
            </div>

            {/* Delete */}
            {showDelete && onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-medium mb-2 transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hideNameInput && !itemName.trim()}
              className="w-full flow-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
