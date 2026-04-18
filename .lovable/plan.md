
## Ta bort all transparens från pastellfärger

### Hittade transparens-användning
- **StickyNoteCard.tsx**: `/60` på alla 11 sticky note-bakgrunder
- **NotesView.tsx**: `/0.3` på sticky notes i listvy
- **colors.ts**: `getColorCardClass` (`/40`), `getColorBgClass` (`/20`), `getAvatarBgClass` (`/30`)
- **index.css**: `.flow-badge-*` (`/0.2`)
- **HomeView.tsx**: event-rader `/20`
- **ProfileView.tsx**: avatar `/30`, ikon-rutor `/20`
- **FolderListCard.tsx**: folder-badge `/0.3`
- **EventModals + CalendarItemList + WeekDayView + MonthView**: event-bakgrunder `/20`, `/40`

### Lösning
Ersätt alla `/N` opacity-suffix på `pastel-*` med full opacity. Färgerna i Light-paletten är redan mjuka (designade för ytor) så de fungerar bra utan transparens.

### Ändringar
1. **`src/lib/colors.ts`** — ta bort `/40`, `/30`, `/20` från:
   - `getColorBgClass` → `bg-pastel-{c}`
   - `getColorCardClass` → `bg-pastel-{c}`
   - `getAvatarBgClass` → `bg-pastel-{c}`
2. **`src/index.css`** — `.flow-badge-*` ta bort `/0.2` från bg (behåll text-färg, byt eventuellt till accent-text för läsbarhet)
3. **`src/components/notes/StickyNoteCard.tsx`** — `getStickyBgClass` ta bort `/60`
4. **`src/components/views/NotesView.tsx`** — sticky note `cardBgClass` ta bort `/0.3`
5. **`src/components/notes/FolderListCard.tsx`** — folder-badge ta bort `/0.3`
6. **`src/components/views/HomeView.tsx`** — event-rader ta bort `/20`
7. **`src/components/views/ProfileView.tsx`** — avatar `/30` + 4 ikon-rutor `/20` → ta bort
8. **Calendar**: `WeekDayView.tsx`, `MonthView.tsx`, `CalendarItemList.tsx`, `CreateEventModal.tsx`, `EditEventModal.tsx` — ta bort `/20`, `/40` på event/note-bakgrunder

### Notera
Tar INTE bort:
- `opacity-*` på inaktiva element (t.ex. `opacity-25` för dimmed days)
- transparens på `bg-black/`, `bg-white/`, `bg-card/`, `bg-secondary/` (de är inte pastellfärger)
- shadow/overlay opacity
