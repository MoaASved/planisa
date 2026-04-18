
## Typografi-audit & polish-pass — Flow Planner

### Mål
Skapa ett sammanhängande typografisystem som känns "designat av samma person" över Calendar, Tasks, Notes, Notebooks — utan att tvinga alla rubriker till samma storlek.

### Nuvarande problem (observerade)
- **Tasks-rubriken**: `text-[34px] font-bold` — för dominant, bryter mot lugnare rubriker i Calendar/Notes.
- **Sektionsrubriker** (`SectionHeader.tsx`): `text-xs uppercase tracking-wider font-semibold` — hård ALL CAPS, känns påklistrat.
- **Inkonsekvenser**: olika views använder ad hoc `text-2xl`, `text-3xl`, `text-[34px]`, `font-bold` vs `font-semibold` utan logik.
- **Metadata/labels**: blandar `text-xs` och `text-[11px]`, `text-muted-foreground` vs `text-muted-foreground/60` slumpmässigt.
- **Letter-spacing**: saknas `tracking-tight` på stora rubriker (Apple-känsla).

---

### Designsystem — typografiska skalor

**Page headers** (Tasks, Notes, Calendar månad/år): 
- `text-[28px] font-semibold tracking-tight` (ned från 34px bold)

**Section titles inom en sida** (My Lists, Folders, Today-sektion):
- `text-[15px] font-semibold tracking-tight text-foreground` 
- Räkneord bredvid: `text-[13px] font-normal text-muted-foreground/70`
- **Bort med ALL CAPS** — använd Title Case istället

**Card titles** (list/folder/notebook-kort, smart list-kort):
- `text-[15px] font-medium tracking-tight`

**Modal titles**:
- `text-[17px] font-semibold tracking-tight`

**Body / task text / note content**:
- `text-[15px] font-normal leading-snug`

**Metadata / counts / dates / helpers**:
- `text-[13px] font-normal text-muted-foreground`
- Sekundär metadata: `text-[12px] text-muted-foreground/70`

**Buttons / CTA**:
- Primär: `text-[14px] font-medium`
- Sekundär/menyval: `text-[14px] font-normal`

**Labels** (form, taggar):
- `text-[12px] font-medium tracking-wide` (lätt tracking, INTE uppercase)

---

### Filer att uppdatera

**Page headers**
- `src/components/views/TasksView.tsx` — "Tasks"-rubrik
- `src/components/views/NotesView.tsx` — "Notes"-rubrik  
- `src/components/views/CalendarView.tsx` + `CalendarHeader.tsx` — månad/år
- `src/components/views/HomeView.tsx` — greeting/sektioner
- `src/components/views/ProfileView.tsx`

**Section headers**
- `src/components/tasks/SectionHeader.tsx` — ta bort `uppercase tracking-wider`, byt till `text-[15px] font-semibold tracking-tight`, count som mjukare sekundär
- `src/components/tasks/ListDetailView.tsx` — list-titel & sektioner
- `src/components/notes/NotebookView.tsx` — sektionsrubriker
- `src/components/calendar/CalendarItemList.tsx` — datumrubriker

**Cards**
- `src/components/tasks/SmartListCard.tsx`, `MyListRow.tsx`, `TaskRow.tsx`, `CompletedTaskCard.tsx`
- `src/components/notes/NotebookCard.tsx`, `NotebookListCard.tsx`, `FolderGridCard.tsx`, `FolderListCard.tsx`, `StickyNoteCard.tsx`

**Modals**
- `src/components/modals/*` — DialogTitle storlek/vikt
- `src/components/tasks/AddTaskModal.tsx`, `CreateListModal.tsx`, `TaskEditPanel.tsx`
- `src/components/notes/NotebookEditModal.tsx`, `FolderEditModal.tsx`, `NoteEditor.tsx`

**Navigation**
- `src/components/navigation/TopBar.tsx`, `TabNavigation.tsx`

**Globala stilar**
- `src/index.css` — lägg till hjälpklasser: `.flow-page-title`, `.flow-section-title`, `.flow-card-title`, `.flow-meta`, `.flow-meta-sm` så framtida komponenter automatiskt följer systemet

---

### Designprinciper genom passet
- **`tracking-tight`** på alla rubriker ≥15px (Apple-polish)
- **`font-semibold` istället för `font-bold`** överallt — bold känns för tungt mot beige bg
- **Inga ALL CAPS** utom möjligen små metadata-labels med `tracking-wide`
- **Mjukare hierarki**: max 3 vikt-nivåer per skärm (semibold / medium / normal)
- **Konsekvent muted**: `text-muted-foreground` för primär metadata, `/70` för svagare

### Resultat
- Tasks-rubriken blir lugnare (28px semibold istället för 34px bold).
- Sektionsrubriker (My Lists, Today, etc.) blir mjuka Title Case-rubriker istället för hårda ALL CAPS.
- Hela appen får samma rytm i typografi — kort, modaler, headers, metadata.
- Hjälpklasser i `index.css` säkrar konsistens framåt.

### Spara till memory
Ny `mem://design/typography-system` med skalan ovan + uppdatera `index.md` Core med kort regel.
