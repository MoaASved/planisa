
## Plan: Auto-ifyllning av sluttid (starttid + 1 timme) overallt

### Sammanfattning
Nar man anger en starttid ska sluttiden automatiskt fyllas i till exakt 1 timme senare -- om anvandaren inte redan manuellt andrat sluttiden. CreateEventModal har redan denna logik, sa vi ateranvander samma monster i alla andra stallen.

### Logik
- Nar starttid andras: berakna `startTime + 1 timme` (max 23:59) och satt som sluttid
- Om anvandaren manuellt andrar sluttiden: sluta auto-berakna (anvand en `useRef`-flagga)
- Redan implementerat i `CreateEventModal` -- samma monster kopieras

### Filer som paverkas

| Fil | Andring |
|-----|---------|
| `src/components/modals/EditEventModal.tsx` | Lagg till auto-berakning av endTime nar startTime andras |
| `src/components/tasks/TaskEditPanel.tsx` | Lagg till auto-berakning av tempEndTime nar tempTime andras |
| `src/components/modals/CalendarNoteModal.tsx` | Lagg till auto-berakning av endTime nar time andras |
| `src/components/notes/NoteEditor.tsx` | Lagg till auto-berakning av endTime nar time andras |

### Tekniska detaljer

Varje fil far:

1. En `useRef(false)` for `endTimeManuallySet` -- satts till `true` nar anvandaren andrar sluttiden manuellt
2. En hjalpfunktion som beraknar `+1 timme`:
```typescript
const calculateEndTime = (start: string): string => {
  const [h, m] = start.split(':').map(Number);
  const endH = Math.min(h + 1, 23);
  const endMin = h + 1 > 23 ? 59 : m;
  return `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
};
```
3. Starttid-onChange anropar berakningen och sattar sluttid (om flaggan inte ar satt)
4. Sluttid-onChange sattar flaggan till `true`
5. Flaggan aterställs vid komponent-reset (t.ex. nar modal oppnas med ny data)
