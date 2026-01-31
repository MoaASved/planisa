
## Plan: Undo-toast vid Delete

### Sammanfattning
Implementera en "Ångra"-funktion som visas som en toast-notifikation i 5 sekunder när användaren raderar en task, event eller note. Om användaren klickar "Ångra" återställs objektet.

---

## Teknisk lösning

### Ny hook: `useUndoableDelete`
Skapa en hook som hanterar delete med undo-funktionalitet genom att:
1. Spara det raderade objektet temporärt
2. Visa en toast med "Ångra"-knapp
3. Om användaren klickar ångra → återställ objektet
4. Om timeout (5 sek) → objektet förblir raderat

**Ny fil:** `src/hooks/useUndoableDelete.ts`

```typescript
// Hook som tar emot delete-funktioner och returnerar 
// wrapper-funktioner med undo-stöd
export function useUndoableDelete() {
  const deleteTaskWithUndo = (task: Task, deleteTask: fn) => {
    deleteTask(task.id);
    toast("Uppgift raderad", {
      action: {
        label: "Ångra",
        onClick: () => addTask(task) // Återställ
      },
      duration: 5000
    });
  };
  // Samma för events och notes
}
```

---

## Filer som ändras

### 1. Ny fil: `src/hooks/useUndoableDelete.ts`
Hook med logik för undo-delete för alla typer (tasks, events, notes).

### 2. `src/components/tasks/TaskEditPanel.tsx`
**Rad 55-58:** Ändra `handleDelete` till att använda undo-hook istället för direkt delete.

```tsx
// Före:
const handleDelete = () => {
  deleteTask(task.id);
  onClose();
};

// Efter:
const { deleteWithUndo } = useUndoableDelete();
const handleDelete = () => {
  deleteWithUndo('task', task);
  onClose();
};
```

### 3. `src/components/tasks/CompletedTaskCard.tsx`
Uppdatera `onDelete` prop-hanteringen för att använda undo-toast.

### 4. `src/components/notes/NoteEditor.tsx`
**Rad 154-158:** Samma mönster för notes.

### 5. `src/components/notes/StickyNoteEditor.tsx`
**Rad 68-72:** Samma mönster för sticky notes.

### 6. `src/components/notes/NotebookPageEditor.tsx`
**Rad 108-112:** Samma mönster för notebook pages.

### 7. `src/components/modals/EditEventModal.tsx`
**Rad 70-74:** Samma mönster för events.

---

## Visuellt resultat

När användaren klickar "Delete":

```text
┌─────────────────────────────────────────┐
│  ✓ Uppgift raderad          [Ångra]    │
│                                         │
│  ═══════════════════════════            │  ← Progress bar (5 sek)
└─────────────────────────────────────────┘
```

Efter klick på "Ångra":
- Objektet återställs till listan
- Toast försvinner
- Haptic feedback (success)

---

## Implementation av hooken

```typescript
// src/hooks/useUndoableDelete.ts
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { useHaptics } from './useHaptics';
import { Task, CalendarEvent, Note, NotebookPage } from '@/types';

type DeleteType = 'task' | 'event' | 'note' | 'notebookPage';

export function useUndoableDelete() {
  const { 
    addTask, deleteTask,
    addEvent, deleteEvent,
    addNote, deleteNote,
    addNotebookPage, deleteNotebookPage 
  } = useAppStore();
  const haptics = useHaptics();

  const deleteWithUndo = (
    type: DeleteType, 
    item: Task | CalendarEvent | Note | NotebookPage
  ) => {
    // Utför delete
    switch (type) {
      case 'task': deleteTask(item.id); break;
      case 'event': deleteEvent(item.id); break;
      case 'note': deleteNote(item.id); break;
      case 'notebookPage': deleteNotebookPage(item.id); break;
    }
    
    haptics.error(); // Haptic för delete
    
    // Visa toast med ångra-knapp
    toast(getDeleteMessage(type), {
      action: {
        label: 'Ångra',
        onClick: () => restoreItem(type, item)
      },
      duration: 5000,
    });
  };

  const restoreItem = (type: DeleteType, item: any) => {
    switch (type) {
      case 'task': 
        addTask({ ...item }); 
        break;
      case 'event': 
        addEvent({ ...item }); 
        break;
      case 'note': 
        addNote({ ...item }); 
        break;
      case 'notebookPage': 
        addNotebookPage({ ...item }); 
        break;
    }
    haptics.success();
    toast.success('Återställd!');
  };

  return { deleteWithUndo };
}
```

---

## Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/hooks/useUndoableDelete.ts` | **NY FIL** - Hook för delete med undo |
| `src/components/tasks/TaskEditPanel.tsx` | Använd `deleteWithUndo` istället för `deleteTask` |
| `src/components/tasks/CompletedTaskCard.tsx` | Uppdatera delete-hantering via prop från parent |
| `src/components/views/TasksView.tsx` | Skicka `deleteWithUndo` till CompletedTaskCard |
| `src/components/notes/NoteEditor.tsx` | Använd `deleteWithUndo` för notes |
| `src/components/notes/StickyNoteEditor.tsx` | Använd `deleteWithUndo` för sticky notes |
| `src/components/notes/NotebookPageEditor.tsx` | Använd `deleteWithUndo` för notebook pages |
| `src/components/modals/EditEventModal.tsx` | Använd `deleteWithUndo` för events |

---

## Fördelar med denna lösning

1. **Återanvändbar hook** - Samma logik för alla delete-operationer
2. **Konsekvent UX** - Samma beteende överallt i appen
3. **5 sekunders ångra-fönster** - Tillräckligt för att hinna ångra misstag
4. **Haptic feedback** - Taktil bekräftelse på mobil
5. **Minimal påverkan på store** - Ingen undo-stack behövs, vi återställer genom att lägga till igen
