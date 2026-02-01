import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notebook } from '@/types';

interface NotebookActionSheetProps {
  notebook: Notebook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function NotebookActionSheet({ 
  notebook, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete 
}: NotebookActionSheetProps) {
  if (!notebook) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        {/* Notebook preview */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
          <div className={cn(
            'w-10 h-12 rounded-lg relative overflow-hidden',
            `bg-[hsl(var(--pastel-${notebook.color}))]`
          )}>
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10" />
          </div>
          <span className="font-semibold text-foreground">{notebook.name}</span>
        </div>

        {/* Actions */}
        <div className="p-2">
          <button
            onClick={() => { onEdit(); onOpenChange(false); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
          >
            <Edit3 className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Edit Notebook</span>
          </button>
          
          <button
            onClick={() => { onDelete(); onOpenChange(false); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete Notebook</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
