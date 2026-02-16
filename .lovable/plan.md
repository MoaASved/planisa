

## Plan: Ny CalendarTaskModal (likt CalendarNoteModal)

### Sammanfattning
Skapa en ny `CalendarTaskModal` som ersatter den nuvarande `TaskEditPanel`-popupen nar man klickar pa en task i kalendern. Modalen foljer exakt samma stil som `CalendarNoteModal` -- kompakt bottom-sheet med modernt utseende.

### Innehall i modalen

```text
+----------------------------------------------+
| Task                                    [X]  |
|----------------------------------------------|
| [ Titel-input                              ] |
|----------------------------------------------|
| [ ] Subtask 1                                |
| [v] Subtask 2  (avbockad)                    |
| [ + ] Lagg till subtask...                   |
|----------------------------------------------|
|   [ Open ]          [ Save ]                 |
+----------------------------------------------+
```

1. **Header**: "Task" + stangknapp (som CalendarNoteModal)
2. **Titelinput**: Redigerbart textfalt i `bg-secondary rounded-xl`
3. **Subtasks-lista**: Visa alla subtasks med avbockningsbara checkboxar. Avbockade far genomstruken text. Plus en "Add subtask..." input langst ner
4. **Open-knapp**: Navigerar till Tasks-fliken (exakt som notens "Open"-knapp)
5. **Save-knapp**: Sparar titel-andringar och stanger modalen

### Tekniska detaljer

**Ny fil: `src/components/modals/CalendarTaskModal.tsx`**

- Props: `task: Task | null`, `isOpen: boolean`, `onClose: () => void`, `onOpenInTasks: (task: Task) => void`
- State: `title`, `newSubtask`
- Anvander `toggleSubtask`, `addSubtask`, `removeSubtask`, `updateTask` fran `useAppStore`
- Layouten ar en kopia av CalendarNoteModal: `fixed inset-x-3 bottom-3 z-50 bg-card rounded-2xl p-4 max-w-sm mx-auto animate-scale-in shadow-elevated`
- Subtask-checkboxar anvander runda checkboxar med `bg-primary` nar avbockade (matchar SwipeableTaskCard-stilen)
- Open-knappen har `bg-primary/10 text-primary` stil med en `ExternalLink` eller `ListTodo` ikon

**Andrad fil: `src/components/views/CalendarView.tsx`**

- Importera `CalendarTaskModal` istallet for att rendera `TaskEditPanel` inline
- Lagg till en `handleOpenTaskInTasks`-funktion som satter `activeTab` till `'tasks'` via en callback/prop
- Ersatt hela task-editing-blocket (rad 175-186) med `<CalendarTaskModal>`
- Ta bort den gamla TaskEditPanel-wrappern med backdrop

**Andrad fil: `src/pages/Index.tsx`**

- Skicka en `onNavigateToTask`-callback till CalendarView som byter aktiv flik till Tasks

### Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/modals/CalendarTaskModal.tsx` | Ny fil -- kompakt bottom-sheet modal for tasks i kalendern |
| `src/components/views/CalendarView.tsx` | Ersatt TaskEditPanel med CalendarTaskModal, lagg till navigation-callback |
| `src/pages/Index.tsx` | Skicka tab-navigation callback till CalendarView |

