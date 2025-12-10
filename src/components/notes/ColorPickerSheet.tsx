import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PastelColor } from '@/types';
import { pastelColors } from '@/lib/colors';

interface ColorPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor?: PastelColor;
  onSelectColor: (color?: PastelColor) => void;
}

export function ColorPickerSheet({ isOpen, onClose, selectedColor, onSelectColor }: ColorPickerSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" 
        onClick={onClose} 
      />
      <div className="fixed inset-x-0 bottom-0 z-50 flow-bottom-sheet animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Note Color</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-secondary">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {/* No color option */}
          <button
            onClick={() => onSelectColor(undefined)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors',
              !selectedColor ? 'bg-primary/10' : 'hover:bg-secondary'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-card border-2 border-dashed border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground">—</span>
            </div>
            <span className="flex-1 text-left font-medium text-foreground">No color</span>
            {!selectedColor && <Check className="w-5 h-5 text-primary" />}
          </button>

          {/* Color grid */}
          <div className="grid grid-cols-5 gap-3">
            {pastelColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onSelectColor(color.value)}
                className={cn(
                  'aspect-square rounded-2xl transition-all relative',
                  `bg-pastel-${color.value}/30`,
                  selectedColor === color.value && 'ring-2 ring-offset-2 ring-primary'
                )}
              >
                {selectedColor === color.value && (
                  <Check className="w-5 h-5 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>

          {/* Preview */}
          {selectedColor && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className={cn(
                'rounded-2xl p-4 transition-all',
                `bg-pastel-${selectedColor}/30`
              )}>
                <h4 className="font-semibold text-foreground">Sample Note</h4>
                <p className="text-sm text-muted-foreground mt-1">This is how your note will look in the list...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
