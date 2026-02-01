
## Plan: Raderingsmöjlighet för Notebooks

### Sammanfattning
Implementerar två sätt att hantera notebooks:
1. **Profile-sektion** - Lägger till "Notebooks" under "Categories & Folders" i Profile (precis som Folders fungerar idag)
2. **Long-press** - Håll in på en notebook i grid/list-vyn för att visa snabbmeny med redigera/radera

---

## Ändringar

### 1. Uppdatera ProfileView.tsx

**Lägg till notebooks i store-importen:**
```tsx
const { 
  // ... existing imports
  notebooks,
  addNotebook,
  updateNotebook,
  deleteNotebook
} = useAppStore();
```

**Utöka CategorySection type:**
```tsx
type CategorySection = 'calendar' | 'tasks' | 'notes' | 'notebooks';
```

**Uppdatera handleAddItem och handleUpdateItem för notebooks:**
```tsx
case 'notebooks':
  addNotebook({ name: newItemName.trim(), color: newItemColor });
  break;

// och för update:
case 'notebooks':
  updateNotebook(editItemId, { name: editItemName.trim(), color: editItemColor });
  break;
```

**Lägg till ny sektion för Notebooks (efter Notes Folders):**
```tsx
{/* Notebooks */}
<div className="flow-card-flat p-2">
  <button
    onClick={() => toggleSection('notebooks')}
    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-pastel-coral/20 flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-pastel-coral" />
      </div>
      <div className="text-left">
        <p className="font-medium text-foreground">Notebooks</p>
        <p className="text-sm text-muted-foreground">{notebooks.length} notebooks</p>
      </div>
    </div>
    {expandedSection === 'notebooks' ? <ChevronDown /> : <ChevronRight />}
  </button>

  {expandedSection === 'notebooks' && (
    <div className="mt-2 space-y-1 animate-fade-in">
      {notebooks.map((notebook) => (
        <div key={notebook.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary">
          <div className="flex items-center gap-3">
            <div className={cn('w-4 h-4 rounded-full', `bg-pastel-${notebook.color}`)} />
            <span className="font-medium text-foreground">{notebook.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => openEditDrawer('notebooks', notebook.id, notebook.name, notebook.color)}>
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => deleteNotebook(notebook.id)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => openAddDrawer('notebooks')}>
        Add New Notebook
      </button>
    </div>
  )}
</div>
```

---

### 2. Skapa useLongPress hook (ny fil)

**`src/hooks/useLongPress.ts`**
```tsx
import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  };
}
```

---

### 3. Uppdatera NotebookCard.tsx med long-press

```tsx
import { useLongPress } from '@/hooks/useLongPress';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
  onLongPress?: () => void;  // Ny prop
}

export function NotebookCard({ notebook, onClick, onLongPress }: NotebookCardProps) {
  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress?.(),
    onClick: onClick,
    delay: 500,
  });

  return (
    <button
      {...longPressHandlers}
      className="..."
    >
      ...
    </button>
  );
}
```

---

### 4. Uppdatera NotebookListCard.tsx med long-press

Samma mönster som NotebookCard - lägg till `onLongPress` prop och `useLongPress` hook.

---

### 5. Skapa NotebookActionSheet komponent (ny fil)

**`src/components/notes/NotebookActionSheet.tsx`**

En minimalistisk bottom sheet som visas vid long-press:

```tsx
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Edit3, Trash2, BookOpen } from 'lucide-react';
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
          <div className={cn('w-10 h-12 rounded-lg', `bg-[hsl(var(--pastel-${notebook.color}))]`)} />
          <span className="font-semibold">{notebook.name}</span>
        </div>

        {/* Actions */}
        <div className="p-2">
          <button
            onClick={() => { onEdit(); onOpenChange(false); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary"
          >
            <Edit3 className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Edit Notebook</span>
          </button>
          
          <button
            onClick={() => { onDelete(); onOpenChange(false); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete Notebook</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

---

### 6. Uppdatera NotesView.tsx

**Lägg till state och handlers för action sheet:**
```tsx
const [actionSheetNotebook, setActionSheetNotebook] = useState<Notebook | null>(null);
const [showNotebookActions, setShowNotebookActions] = useState(false);

const handleNotebookLongPress = (notebook: Notebook) => {
  haptics.medium(); // Haptic feedback
  setActionSheetNotebook(notebook);
  setShowNotebookActions(true);
};

const handleDeleteNotebook = () => {
  if (actionSheetNotebook) {
    deleteNotebook(actionSheetNotebook.id);
    haptics.error();
  }
};

const handleEditNotebook = () => {
  // Öppna edit modal med vald notebook
  // Kan återanvända befintlig notebook modal
};
```

**Uppdatera notebook-rendering:**
```tsx
{layoutMode === 'grid' ? (
  <NotebookCard 
    notebook={notebook} 
    onClick={() => setSelectedNotebook(notebook)}
    onLongPress={() => handleNotebookLongPress(notebook)}
  />
) : (
  <NotebookListCard 
    notebook={notebook} 
    onClick={() => setSelectedNotebook(notebook)}
    onLongPress={() => handleNotebookLongPress(notebook)}
  />
)}
```

**Lägg till ActionSheet i JSX:**
```tsx
<NotebookActionSheet
  notebook={actionSheetNotebook}
  open={showNotebookActions}
  onOpenChange={setShowNotebookActions}
  onEdit={handleEditNotebook}
  onDelete={handleDeleteNotebook}
/>
```

---

## Visuell översikt

**Profile-vyn:**
```text
Categories & Folders
┌─────────────────────────────────┐
│ 📅 Calendar Categories    5 >  │
├─────────────────────────────────┤
│ ✅ Tasks Categories       5 >  │
├─────────────────────────────────┤
│ 📁 Notes Folders          4 >  │
├─────────────────────────────────┤
│ 📓 Notebooks              2 >  │  <- NY SEKTION
└─────────────────────────────────┘
```

**Long-press action sheet:**
```text
┌─────────────────────────────────┐
│  📓  My Notebook                │
├─────────────────────────────────┤
│  ✏️  Edit Notebook              │
│  🗑️  Delete Notebook            │
└─────────────────────────────────┘
```

---

## Filer som påverkas

| Fil | Åtgärd |
|-----|--------|
| `src/hooks/useLongPress.ts` | Ny fil - hook för long-press |
| `src/components/notes/NotebookActionSheet.tsx` | Ny fil - action sheet komponent |
| `src/components/views/ProfileView.tsx` | Lägg till Notebooks-sektion |
| `src/components/notes/NotebookCard.tsx` | Lägg till long-press support |
| `src/components/notes/NotebookListCard.tsx` | Lägg till long-press support |
| `src/components/views/NotesView.tsx` | Integrera action sheet och handlers |

---

## Animationer och UX

| Interaktion | Feedback |
|-------------|----------|
| Long-press start | 500ms delay innan aktivering |
| Action sheet öppnas | Slide-up animation från Drawer |
| Haptic feedback | `medium` vid long-press, `error` vid delete |
| Delete | Omedelbar radering utan bekräftelse (enligt projektstandard) |
