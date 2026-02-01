
## Plan: List-vy för Notebooks och Folders

### Sammanfattning
Lägger till möjlighet att växla mellan grid-vy (nuvarande macOS-stilikoner) och list-vy (staplade kort) för både Notebooks och Folders. List-vyn har en modern, minimalistisk design med mjuka animationer.

---

## Ändringar

### 1. Skapa `NotebookListCard.tsx` (ny fil)

En kompakt list-variant av NotebookCard med horisontell layout:

```tsx
import { BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notebook } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface NotebookListCardProps {
  notebook: Notebook;
  onClick: () => void;
}

export function NotebookListCard({ notebook, onClick }: NotebookListCardProps) {
  const { notebookPages } = useAppStore();
  const pageCount = notebookPages.filter(p => p.notebookId === notebook.id).length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border',
        'transition-all duration-200 active:scale-[0.98] hover:shadow-md group'
      )}
    >
      {/* Compact notebook icon */}
      <div className={cn(
        'w-12 h-14 rounded-lg flex items-center justify-center relative flex-shrink-0',
        `bg-[hsl(var(--pastel-${notebook.color}))]`
      )}>
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-lg" />
        <BookOpen className="w-5 h-5 text-white/80" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-semibold text-foreground truncate">{notebook.name}</h4>
        <p className="text-sm text-muted-foreground">
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
        </p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
```

---

### 2. Skapa `FolderListCard.tsx` (ny fil)

En kompakt list-variant av folder-kortet:

```tsx
import { FolderOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Folder } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface FolderListCardProps {
  folder: Folder;
  count: number;
  onClick: () => void;
}

export function FolderListCard({ folder, count, onClick }: FolderListCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border',
        'transition-all duration-200 active:scale-[0.98] hover:shadow-md group'
      )}
    >
      {/* Folder icon */}
      <div className={cn(
        'w-12 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        `bg-[hsl(var(--pastel-${folder.color})/0.3)]`
      )}>
        <FolderOpen className={cn('w-6 h-6', `text-[hsl(var(--pastel-${folder.color}))]`)} />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-semibold text-foreground truncate">{folder.name}</h4>
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
      
      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
```

---

### 3. Uppdatera `NotesView.tsx`

**Notebooks-sektionen (rad ~287-352):**

Ersätt den fasta grid-layouten med villkorlig layout baserat på `layoutMode`:

```tsx
// Notebooks view
if (viewTab === 'notebooks') {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        <TabsHeader />
        
        {showSearch && (
          <div className="mb-4 animate-fade-in">
            <input ... />
          </div>
        )}

        {/* Conditional layout */}
        <div className={cn(
          layoutMode === 'grid' 
            ? 'grid grid-cols-3 gap-4' 
            : 'space-y-3'
        )}>
          {notebooks.map((notebook, index) => (
            <div 
              key={notebook.id} 
              className="stagger-item" 
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {layoutMode === 'grid' ? (
                <NotebookCard notebook={notebook} onClick={() => setSelectedNotebook(notebook)} />
              ) : (
                <NotebookListCard notebook={notebook} onClick={() => setSelectedNotebook(notebook)} />
              )}
            </div>
          ))}

          {/* Add notebook button - adapts to layout */}
          {layoutMode === 'grid' ? (
            <button onClick={() => setShowNotebookModal(true)} className="...grid style...">
              ...
            </button>
          ) : (
            <button onClick={() => setShowNotebookModal(true)} 
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-all active:scale-[0.98] hover:bg-secondary/30"
            >
              <div className="w-12 h-14 rounded-lg flex items-center justify-center bg-secondary/30">
                <Plus className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <span className="font-medium text-muted-foreground">New Notebook</span>
            </button>
          )}
        </div>
        ...
      </div>
    </div>
  );
}
```

**Folders-sektionen (rad ~394-502):**

Samma mönster - villkorlig layout:

```tsx
// Folders view
if (viewTab === 'folders') {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-4">
        <TabsHeader />

        {showSearch && ...}

        {/* Conditional layout */}
        <div className={cn(
          layoutMode === 'grid' 
            ? 'grid grid-cols-3 gap-4' 
            : 'space-y-3'
        )}>
          {folders.map((folder, index) => {
            const count = notes.filter(n => n.folder === folder.name).length;
            return (
              <div 
                key={folder.id} 
                className="stagger-item" 
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {layoutMode === 'grid' ? (
                  // Existing SVG folder button
                  <button onClick={() => setSelectedFolder(folder)} className="...">
                    <svg>...</svg>
                    ...
                  </button>
                ) : (
                  <FolderListCard folder={folder} count={count} onClick={() => setSelectedFolder(folder)} />
                )}
              </div>
            );
          })}

          {/* Add folder button - adapts to layout */}
          {layoutMode === 'grid' ? (
            <button onClick={() => setShowFolderModal(true)} className="...grid style...">
              ...
            </button>
          ) : (
            <button onClick={() => setShowFolderModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 transition-all active:scale-[0.98] hover:bg-secondary/30"
            >
              <div className="w-12 h-10 rounded-lg flex items-center justify-center bg-secondary/30">
                <Plus className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <span className="font-medium text-muted-foreground">New Folder</span>
            </button>
          )}
        </div>

        {/* No folder section - also adapts */}
        {(() => {
          const noFolderNotes = notes.filter(n => !n.folder);
          if (noFolderNotes.length === 0) return null;
          return (
            <div className="mt-6 pt-4 border-t border-border/50">
              {layoutMode === 'grid' ? (
                // Existing grid style
                <button onClick={() => setSelectedFolder({...})} className="...">
                  <svg>...</svg>
                  ...
                </button>
              ) : (
                <FolderListCard 
                  folder={{ id: '__no_folder__', name: 'No Folder', color: 'gray' } as Folder}
                  count={noFolderNotes.length}
                  onClick={() => setSelectedFolder({...})}
                />
              )}
            </div>
          );
        })()}
        ...
      </div>
    </div>
  );
}
```

---

### 4. Imports i NotesView.tsx

Lägg till de nya komponenterna:

```tsx
import { NotebookListCard } from '@/components/notes/NotebookListCard';
import { FolderListCard } from '@/components/notes/FolderListCard';
```

---

## Animationer

| Element | Animation |
|---------|-----------|
| List-kort | `stagger-item` med 40ms delay per item för mjuk cascade |
| Hover | `hover:shadow-md` + `group-hover:opacity-100` på chevron |
| Press | `active:scale-[0.98]` för taktil feedback |
| Layout-byte | `transition-all duration-200` på alla kort |

---

## Visuell skillnad

**Grid-vy (nuvarande):**
```text
┌────┐  ┌────┐  ┌────┐
│ 📓 │  │ 📓 │  │ + │
│Name│  │Name│  │New │
└────┘  └────┘  └────┘
```

**List-vy (ny):**
```text
┌───────────────────────────────┐
│ 📓  Notebook Name    3 pages >│
├───────────────────────────────┤
│ 📓  Work Notes       5 pages >│
├───────────────────────────────┤
│ +   New Notebook              │
└───────────────────────────────┘
```

---

## Filer som påverkas

| Fil | Åtgärd |
|-----|--------|
| `src/components/notes/NotebookListCard.tsx` | Ny fil |
| `src/components/notes/FolderListCard.tsx` | Ny fil |
| `src/components/views/NotesView.tsx` | Uppdatera Notebooks och Folders-sektionerna |
