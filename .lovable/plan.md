

## Fix Edit Task: clickable date/time + 30-min default + calendar sync

### Diagnos

1. **Date/Time inte klickbara i AddTaskModal (edit-läge):** Raderna är layout-strukturerade som `[ikon] [label] [input flex-1 text-right]`. Native `<input type="date|time">` på mobil triggas bara när man tappar själva input-zonen — ikonen/labeln är inte kopplade så stora delar av raden gör ingenting. Inputten har dessutom inget tydligt "tap target".
2. **30-min default saknas:** När man väljer tid fylls inte `endTime` i automatiskt → tasks visas bara som punkter i timeline, inte som block.
3. **Kalender-sync:** Tasks med datum visas redan i kalendern (`CalendarItemList` filtrerar på `t.date` och placerar `untimedTasks` överst, `timedTasks` i timeline). Den fungerar — men eftersom `endTime` aldrig sätts blir block 0-min höga. Fixas via punkt 2.

### Lösning

**Fil 1: `src/components/tasks/AddTaskModal.tsx`**

A. **Gör hela Date/Time-raden klickbar:**
- Wrappa hela raden i en `<label>` så tap på ikon eller label fokuserar den dolda inputten.
- Ge inputten `w-full text-left` istället för `flex-1 text-right`, och lägg en visuell "value pill" till höger som placeholder när tom.
- Lägg `cursor-pointer` på label, `pointer-events-none` på ikoner.
- Lägg `relative` + `inset-0` absolut input som täcker hela raden (vanlig iOS-trick) så hela ytan triggar pickern.

B. **Auto 30-min default endTime:**
- Lägg till `endTime` state.
- I `useEffect` (edit): `setEndTime(editing.endTime ?? '')`.
- När user ändrar `time`: om `endTime` är tomt eller var auto-satt → sätt `endTime = time + 30 min` via en helper `addMinutes(time, 30)`.
- Spar `endTime` i payload.
- Om user manuellt ändrar `endTime` → markera `endTimeManual.current = true` så vi inte skriver över.
- Om user tömmer tid → töm också `endTime`.

C. **Lägg till End time-fält:**
- Ny rad under "Time" som dyker upp endast när `time` är satt: samma stil, label "Ends".
- Använder native `<input type="time">` (per memory-regel).

**Fil 2: ingen ändring i kalendern behövs** — `CalendarItemList` läser redan `t.time` och `t.endTime` och placerar tasks korrekt:
- `untimedTasks` (date utan time) → överst i "all-day"-sektion ✅
- `timedTasks` (date + time) → i timeline med höjd från `time` → `endTime` ✅

D. **Live sync:** `updateTask` i store triggar redan re-render i kalendern via Zustand subscription — när date/time/endTime/title ändras uppdateras kalendern direkt. Ingen extra kod krävs.

E. **Ta bort datum:** `date` blir `undefined` → task försvinner från kalenderns dagsvy automatiskt (filtret kräver `t.date`).

F. **Ta bort tid (men behåll datum):** `time` & `endTime` blir `undefined` → task hamnar i `untimedTasks` (top of day all-day-sektion) automatiskt.

### Layout-skiss för Date-rad (ny)

```
┌─────────────────────────────────────┐
│ 📅  Date              Tue, Apr 22 ▸ │  ← hela raden klickbar (label)
└─────────────────────────────────────┘   native picker öppnas på tap
```

### Resultat

- Tap var som helst på Date/Time-raden öppnar native picker — inga z-index-problem.
- När tid väljs: `endTime` auto-fylls till `time + 30min`, syns direkt som extra rad.
- User kan justera `endTime` manuellt.
- Task med `date` only → överst i kalenderdagen.
- Task med `date + time` → i timeline med 30-min default block.
- Live: alla ändringar reflekteras direkt i kalender via befintlig Zustand-store.

### Filer
- `src/components/tasks/AddTaskModal.tsx` — gör Date/Time-rader fullt klickbara, lägg till `endTime` state + auto-30min, lägg till End time-fält.

