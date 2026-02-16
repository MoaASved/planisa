

## Fix: Auto-ifyllning av sluttid vid tidstoggling + Event-tidsinput

### Problem som hittades

1. **TaskEditPanel** (rad 41-52): Nar du trycker pa tidsknappen och gar fran "All Day" till tidslagt, satts `tempTime` till `'09:00'` men `tempEndTime` forblir tom. Saknar `setTempEndTime(calculateEndTime('09:00'))`.

2. **CreateEventModal** (rad 23): `isAllDay` startar som `false`, vilket innebar att tidsfalten visas -- men "All Day"-togglen visar sig som "av" (gra), sa det ser ut som att All Day ar av. Problemet ar att togglen ar inverterad visuellt. Nar `isAllDay = false` borde det vara tydligt att tider kan anges. Korrigeringen ar att satta `isAllDay` till `true` som standard, sa anvandaren maste aktivt stanga av "All Day" for att se tidsfalten -- precis som i EditEventModal.

3. **CalendarNoteModal** (rad 116-123): Samma problem som TaskEditPanel -- nar man slapper tidslagen fran "All Day" satts `time` till `'09:00'` men `endTime` satts inte. Saknar `setEndTime(calculateEndTime('09:00'))`.

### Andringar

| Fil | Andring |
|-----|---------|
| `src/components/tasks/TaskEditPanel.tsx` | I `handleTimeToggle` (rad 43-46): lagg till `setTempEndTime(calculateEndTime('09:00'))` och `updateTask` med bade `time` och `endTime` |
| `src/components/modals/CreateEventModal.tsx` | Andra `isAllDay` default fran `false` till `true` (rad 23) sa att anvandaren maste stanga av "All Day" for att se tidsfalten |
| `src/components/modals/CalendarNoteModal.tsx` | I tidstogglingen (rad 117-118): lagg till `setEndTime(calculateEndTime('09:00'))` nar man aktiverar tidslagt |

### Tekniska detaljer

**TaskEditPanel** -- rad 42-46 andras till:
```typescript
if (isAllDay) {
  setIsAllDay(false);
  const defaultTime = '09:00';
  const defaultEndTime = calculateEndTime(defaultTime);
  setTempTime(defaultTime);
  setTempEndTime(defaultEndTime);
  endTimeManuallySet.current = false;
  updateTask(task.id, { time: defaultTime, endTime: defaultEndTime });
}
```

**CreateEventModal** -- rad 23:
```typescript
const [isAllDay, setIsAllDay] = useState(true);  // andrat fran false
```

**CalendarNoteModal** -- rad 116-119 andras till:
```typescript
if (isAllDay) {
  setIsAllDay(false);
  const defaultTime = '09:00';
  setTime(defaultTime);
  setEndTime(calculateEndTime(defaultTime));
  endTimeManuallySet.current = false;
}
```
