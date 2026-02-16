

## Fix: Event-tid och Note end-time auto-berakning

### Problem 1: Event -- kan inte lagga in tid
`isAllDay` sattes till `true` i senaste fixen, men du vill att den ska vara `false` (AV) sa att tidsfalten syns direkt nar du skapar ett event.

**Fil:** `src/components/modals/CreateEventModal.tsx`
- Andra `isAllDay` tillbaka till `false` (rad 23)

### Problem 2: Note -- end time stammer inte efter att man dolt och visat den igen
I NoteEditor, nar man klickar EyeOff-knappen pa end time (rad 594), satts `endTime` till `undefined` men `endTimeManuallySet`-flaggan forblir `true`. Nar end time sedan visas igen (for att start time finns kvar) triggas inte auto-berakningen.

**Fil:** `src/components/notes/NoteEditor.tsx`
- Rad 594: Nar end time doljs, aterstall `endTimeManuallySet.current = false` och berakna nytt endTime direkt baserat pa nuvarande startTime

Andring:
```typescript
// Rad 593-594, nar EyeOff klickas pa end time:
<button 
  onClick={() => {
    endTimeManuallySet.current = false;
    setEndTime(undefined);
  }}
>
```

Dessutom: nar end time visas igen (dvs nar `time` finns men `endTime` ar `undefined`), auto-berakna endTime. Lagg till en `useEffect`:
```typescript
useEffect(() => {
  if (showInCalendar && time && !endTime && !endTimeManuallySet.current) {
    setEndTime(calculateEndTime(time));
  }
}, [showInCalendar, time, endTime]);
```

### Sammanfattning

| Fil | Andring |
|-----|---------|
| `CreateEventModal.tsx` | `isAllDay` default till `false` |
| `NoteEditor.tsx` | Aterstall flagga vid EyeOff + auto-berakna endTime nar den saknas |

