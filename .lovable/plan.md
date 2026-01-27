

## Plan: 30 min automatisk varaktighet + sluttid för Tasks och Notes

### Översikt
Implementera automatisk 30-minutersvaraktighet för Tasks och Notes i kalender-tidslinjen, samt lägga till sluttid-stöd för Notes (samma system som Tasks redan har).

---

### Del 1: Uppdatera Note-typen med tid-fält

**Fil**: `src/types/index.ts`

Lägg till `time` (starttid) och `endTime` fält till Note-interfacet:

```tsx
export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  folder?: string;
  tags: string[];
  color?: PastelColor;
  date?: Date;
  time?: string;      // NY: Starttid
  endTime?: string;   // NY: Sluttid
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  showInCalendar?: boolean;
  hideFromAllNotes?: boolean;
  hideDate?: boolean;
}
```

---

### Del 2: Automatisk 30 min varaktighet i kalendern

**Fil**: `src/components/calendar/CalendarItemList.tsx`

Skapa en hjälpfunktion som beräknar sluttid om ingen är angiven:

```tsx
// Hjälpfunktion: lägg till 30 minuter på en tid
const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};
```

Uppdatera tidsberäkningen i timeline-renderingen:

```tsx
// Nuvarande logik (rad 386-389):
const calculatedEndTime = endTime || time;
const height = (type === 'event' || (type === 'task' && endTime))
  ? Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5)
  : HOUR_HEIGHT * 0.5;

// Ny logik - alltid 30 min om ingen sluttid finns:
const calculatedEndTime = endTime || addMinutes(time, 30);
const height = Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5);
```

Detta gäller för Tasks, Notes och Events.

---

### Del 3: Tid-stöd i NoteEditor

**Fil**: `src/components/notes/NoteEditor.tsx`

Lägg till state och UI för start/sluttid i metadata-panelen:

**State:**
```tsx
const [time, setTime] = useState<string | undefined>(note?.time);
const [endTime, setEndTime] = useState<string | undefined>(note?.endTime);
```

**handleSave uppdatering:**
```tsx
const noteData = {
  // ...existing fields...
  time,
  endTime,
};
```

**UI i metadata-panelen** (efter "Show in calendar" toggle):

```tsx
{/* Start time picker - only shown when showInCalendar is enabled */}
{showInCalendar && (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">Time</span>
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={time || ''}
        onChange={(e) => setTime(e.target.value || undefined)}
        className="bg-secondary rounded-xl px-3 py-2 text-sm"
      />
      {time && (
        <button onClick={() => setTime(undefined)}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
)}

{/* End time picker - only shown when start time exists */}
{showInCalendar && time && (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">End time</span>
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={endTime || ''}
        onChange={(e) => setEndTime(e.target.value || undefined)}
        min={time}
        className="bg-secondary rounded-xl px-3 py-2 text-sm"
      />
      {endTime && (
        <button onClick={() => setEndTime(undefined)}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
)}
```

---

### Del 4: Tid-stöd i CalendarNoteModal

**Fil**: `src/components/modals/CalendarNoteModal.tsx`

Uppdatera modalen för att hantera start/sluttid:

**State:**
```tsx
const [time, setTime] = useState<string | undefined>();
const [endTime, setEndTime] = useState<string | undefined>();

// I useEffect:
setTime(note.time);
setEndTime(note.endTime);
```

**handleSave:**
```tsx
updateNote(note.id, {
  title: title.trim() || 'Untitled',
  date: updatedDate,
  time: isAllDay ? undefined : time,
  endTime: isAllDay ? undefined : endTime,
});
```

**UI - ersätt nuvarande tid-toggle med:**
```tsx
{/* Time toggle */}
<button
  onClick={() => {
    if (isAllDay) {
      setIsAllDay(false);
      setTime('09:00');
    } else {
      setIsAllDay(true);
      setTime(undefined);
      setEndTime(undefined);
    }
  }}
  className={cn(
    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors",
    isAllDay ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"
  )}
>
  <Clock className="w-4 h-4" />
  {isAllDay ? 'All day' : (time || '09:00')}
</button>

{/* Time inputs when not all day */}
{!isAllDay && (
  <div className="flex items-center gap-2 mb-3">
    <input
      type="time"
      value={time || '09:00'}
      onChange={(e) => setTime(e.target.value)}
      className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm"
    />
    <span className="text-muted-foreground">-</span>
    <input
      type="time"
      value={endTime || ''}
      onChange={(e) => setEndTime(e.target.value || undefined)}
      min={time}
      placeholder="End"
      className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm"
    />
  </div>
)}
```

---

### Del 5: Uppdatera CalendarItemList för Notes med tid

**Fil**: `src/components/calendar/CalendarItemList.tsx`

Inkludera Notes med tid i timeline-vyn:

```tsx
// Separera timed och untimed notes
const untimedNotes = dayNotes.filter(n => !n.time);
const timedNotes = dayNotes.filter(n => n.time);

// I allDayItems - använd untimedNotes istället för dayNotes:
if (activeFilters.includes('notes')) {
  untimedNotes.forEach(n => items.push({ type: 'note', item: n }));
}

// I timedItems - lägg till timed notes:
if (activeFilters.includes('notes')) {
  timedNotes.forEach(n => items.push({ 
    type: 'note', 
    item: n, 
    time: n.time!, 
    endTime: n.endTime 
  }));
}

// I allItems - inkludera tid för notes:
if (activeFilters.includes('notes')) {
  dayNotes.forEach(n => items.push({ 
    type: 'note', 
    item: n, 
    time: n.time, 
    endTime: n.endTime 
  }));
}
```

---

### Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/types/index.ts` | Lägg till `time` och `endTime` på Note |
| `src/components/calendar/CalendarItemList.tsx` | 30 min auto-varaktighet + Notes med tid i timeline |
| `src/components/notes/NoteEditor.tsx` | Start/sluttid UI i metadata-panelen |
| `src/components/modals/CalendarNoteModal.tsx` | Start/sluttid UI i kompakt modal |

---

### Visuellt resultat

**Kalender-tidslinje:**
```text
09:00 ┃ ┌──────────────────────────┐
      ┃ │ Task utan sluttid        │  ← Tar 30 min automatiskt
09:30 ┃ └──────────────────────────┘
      ┃ ┌──────────────────────────┐
      ┃ │ Note kl 09:30           │  ← Tar 30 min automatiskt
10:00 ┃ └──────────────────────────┘
      ┃ ┌──────────────────────────┐
      ┃ │                          │
      ┃ │ Task 10:00-11:30         │  ← Specificerad sluttid
      ┃ │                          │
11:30 ┃ └──────────────────────────┘
```

**NoteEditor metadata-panel:**
```text
┌─────────────────────────────────────┐
│ Date          [Jan 27, 2026]        │
│ Show in calendar      [●━━━━━━━━━●] │
│ Time              [09:00] [X]       │  ← Ny rad
│ End time          [10:00] [X]       │  ← Ny rad (visas när tid finns)
│ Hide from All Notes  [○━━━━━━━━━○] │
│ Hide Date           [○━━━━━━━━━○]  │
└─────────────────────────────────────┘
```

