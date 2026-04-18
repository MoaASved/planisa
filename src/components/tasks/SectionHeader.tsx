import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  name: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onMenu?: () => void;
}

export function SectionHeader({ name, count, collapsed, onToggle, onMenu }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 px-1 pt-3 pb-1.5">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-foreground hover:opacity-70 transition-opacity"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className="text-[16px] font-semibold tracking-tight text-foreground normal-case">{name}</span>
        <span className="text-[13px] font-normal text-muted-foreground/60 tabular-nums ml-0.5">{count}</span>
      </button>
      {onMenu && (
        <button
          onClick={onMenu}
          className="ml-auto p-1 -mr-1 text-muted-foreground/60 hover:text-foreground rounded-md hover:bg-secondary"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
