

## Bygg om Tasks-sektionen — iOS Reminders-inspirerad, Planisa-style

### Mål
Riv ut nuvarande Tasks-vy (Today / Priority / Uncategorized carousel) och bygg en ren, premium task-manager byggd kring **Lists** som primärt navigationselement, med **Smart Lists** överst.

---

### 1. Datamodell — utöka utan att bryta

**`src/types/index.ts`** — utöka `TaskCategory` (= "List") och `Task`:
```ts
TaskCategory {
  id, name, color: PastelColor,
  pinned?: boolean,         // för Smart Lists pin-slots
  sortMode?: 'manual' | 'date' | 'created',
  order?: number,           // för manuell sortering av listor
}
Task {
  ...befintligt,
  note?: string,            // kort anteckning (separat från notes-fältet som vi behåller)
  order?: number,           // manuell sortering inom lista/sektion
  sectionId?: string,       // tillhör sektion inom lista
}
TaskSection {                // NY
  id, listId, name, order, collapsed?
}
```

**`src/store/useAppStore.ts`** — lägg till:
- `taskSections: TaskSection[]` med CRUD
- `pinTaskCategory(id)` / `unpinTaskCategory(id)` (max 2 pinnade)
- `reorderTasks(listId, ids[])`
- Utöka `initialTaskCategories` med de 11 nya färgerna mappade till befintliga `PastelColor`-namn (vi behåller `PastelColor`-typen, men uppdaterar HEX-värden i `index.css` om de skiljer sig — dubbelkollas mot mem://design/pastel-color-palette-v2 så vi inte krockar).

> **Färgmappning** (befintliga slots → nya namn i UI):  
> coral→Fern, peach→Pistachio, amber→Lagune, yellow→Sky, mint→Peach, teal→Honey, sky→Peony, lavender→Rose, rose→Plum, gray→Taupe, stone→Stone.  
> Detta håller all befintlig kod intakt — bara visningsnamn + HEX uppdateras.

---

### 2. Ny `TasksView.tsx` — strukturen

```
┌─────────────────────────────────────┐
│  Tasks            [search] [+ List] │  ← header
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐         │
│  │ Priority │  │  Today   │         │  Smart Lists 2x2
│  │   ⭐ 3   │  │  📅 5    │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐         │
│  │ Pinned 1 │  │ Pinned 2 │         │
│  │  ● 12    │  │  ● 4     │         │
│  └──────────┘  └──────────┘         │
├─────────────────────────────────────┤
│  My Lists                           │
│  ● Work          5  ›               │
│  ● Personal      2  ›               │
│  ● Errands       0  ›               │
│  ...                                │
└─────────────────────────────────────┘
```

Tabs (`Tasks` / `Lists`) tas **bort** — allt samlas i en vy. Listor är primärnavigationen.

---

### 3. Nya komponenter (alla i `src/components/tasks/`)

| Komponent | Ansvar |
|---|---|
| `SmartListCard.tsx` | Vit ruta, rundade hörn, färgad cirkel-ikon, titel + count. Variant: `priority` / `today` / `pinned-list` |
| `MyListRow.tsx` | Vertikal listrad: färgcirkel · namn · count · chevron. Swipe-actions (Edit / Delete / Pin) via befintliga touch-handlers |
| `ListDetailView.tsx` | Header (back · färgcirkel · namn · 3-dots) + sektioner + tasks + Add Task inline. Ersätter `CategoryDetailView` |
| `SectionHeader.tsx` | Sektionsrubrik m. collapse-chevron, count, kontextmeny (rename/delete) |
| `NewTaskRow.tsx` | iOS-Reminders-style ren task-row (cirkel-checkbox vänster, titel + meta center, priority/drag höger). Ersätter inte `TaskRow` direkt — vi bygger **`TaskCell.tsx`** som ny, renare variant |
| `CreateListModal.tsx` | Center modal: namn + färgväljare (11 färger) |
| `AddTaskModal.tsx` | Center modal när man skapar utanför en lista: titel · note · subtasks · datum · tid · priority · välj lista |
| `EditTaskModal.tsx` | Samma fält som AddTask, med delete-knapp |
| `ListSortMenu.tsx` | 3-dots i lista: Sort Manual / Date / Created |

**Återanvänd**: `AnimatedCheckbox`, `useHaptics`, `useUndoableDelete` (fast utan toast — bara haptik), `Calendar` (shadcn).

---

### 4. Beteende — Create Task

- **Inne i en lista** → `+`-knapp i header eller längst ner → ny `TaskCell` med inline-input fokuserad direkt → Enter sparar i listan, Enter+tom stänger.
- **Utanför lista** (FAB / Quick Create) → `AddTaskModal` öppnas centrerat → man väljer lista i dropdown → spara.
- **Smart List "Today"** → samma inline-add som idag stamp:ar `date: new Date()`.
- **Smart List "Priority"** → samma inline-add som stamp:ar `priority: 'high'`.

---

### 5. Sektioner inom en lista
- "Add section" bredvid listans `+ Task`.
- Sektioner sparas i `taskSections` (kopplade till `listId`).
- Tasks utan `sectionId` visas under en implicit "Tasks"-toppsektion (ingen header).
- Drag mellan sektioner via long-press (sprint 2 om för stort scope; v1: dropdown-flytt i task-edit-modal).

---

### 6. Completed-sektion (per lista)
Längst ner i `ListDetailView`:
```
Completed (3)        [Show ▾]
```
Klickbar collapse, visar fade:ade `TaskCell` med strikethrough.

---

### 7. Swipe-actions
Använd befintlig touch-pattern från `SwipeableTaskCard` (redan i repo) — anpassa för:
- Vänster→höger: Complete (grön)
- Höger→vänster: Delete (röd) + Priority (gul) — två-stegs reveal som iOS Mail.

---

### 8. Synk till Calendar
Behålls automatiskt: tasks med `date` syns i `CalendarView` via befintlig logik (vi rör inte den filerna).

---

### 9. Filer att skapa / ändra

**Skapa:**
- `src/components/tasks/SmartListCard.tsx`
- `src/components/tasks/MyListRow.tsx`
- `src/components/tasks/ListDetailView.tsx` (ersätter CategoryDetailView i användning)
- `src/components/tasks/SectionHeader.tsx`
- `src/components/tasks/TaskCell.tsx`
- `src/components/tasks/CreateListModal.tsx`
- `src/components/tasks/AddTaskModal.tsx`
- `src/components/tasks/EditTaskModal.tsx`
- `src/components/tasks/ListSortMenu.tsx`

**Skriv om:**
- `src/components/views/TasksView.tsx` — helt ny struktur (Smart Lists 2×2 + My Lists)

**Utöka:**
- `src/types/index.ts` — `TaskSection`, fält på `Task` och `TaskCategory`
- `src/store/useAppStore.ts` — `taskSections`, pin-funktioner, sort, reorder
- `src/index.css` — uppdatera `--pastel-*` HEX till de 11 nya färgerna (Fern/Pistachio/Lagune/Sky/Peach/Honey/Peony/Rose/Plum/Taupe/Stone)
- `src/components/FloatingActionButton.tsx` / `Index.tsx` — när FAB skapar task utanför Tasks-tab → öppna `AddTaskModal`

**Tas bort (eller töms):**
- `src/components/tasks/CategoryCard.tsx`
- `src/components/tasks/CategoryDetailView.tsx`
- `src/components/tasks/InlineTaskInput.tsx` (ersätts av inline-input direkt i `ListDetailView` + smart-list-detail)
- `src/components/tasks/TaskLongPressMenu.tsx` (ersätts av swipe + 3-dots)

---

### 10. Vad som **behålls**
- Synk task ↔ calendar
- Datum/tid via native `<input type="date|time">`
- Subtasks-logik i store
- Pastellfärgssystemet (slots oförändrade, HEX uppdateras)
- Haptik & spring-animationer
- Ingen deletion-toast (per memory-regel)

---

### Resultat
- Tasks-sidan blir en **command center**: Smart Lists överst, alla användarens listor i en stilig staplad lista under.
- Att öppna en lista känns som iOS Reminders fast renare — sektioner, ren task-rad, completed-collapse, sort-meny.
- Snabb create-flow inifrån listor (inline) + en elegant centermodal när man är utanför.
- Visuellt 100 % i linje med resten av Planisa: vita kort, mjuka skuggor, beige bakgrund, mörk navbar.

