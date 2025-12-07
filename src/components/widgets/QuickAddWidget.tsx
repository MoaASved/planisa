import { Plus, Calendar, CheckSquare, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuickAddWidgetProps {
  onQuickAdd?: (type: 'task' | 'event' | 'note') => void;
}

const quickActions = [
  { id: 'task', icon: CheckSquare, label: 'Task', color: 'bg-flow-mint/15 text-flow-mint' },
  { id: 'event', icon: Calendar, label: 'Event', color: 'bg-flow-lavender/15 text-flow-lavender' },
  { id: 'note', icon: FileText, label: 'Note', color: 'bg-flow-amber/15 text-flow-amber' },
] as const;

export function QuickAddWidget({ onQuickAdd }: QuickAddWidgetProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  return (
    <div className="flow-widget h-full animate-fade-up stagger-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Quick Add</h3>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => onQuickAdd?.(action.id)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300',
                action.color,
                hoveredAction === action.id && 'scale-105 shadow-card'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
