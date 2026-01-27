

## Plan: Titel högst upp + hantering av överlappande objekt i tidslinjen

### Översikt
Två förbättringar:
1. Flytta titel + cirkel till toppen av containern (istället för centrerat)
2. Intelligent hantering av överlappande objekt i tidslinjevyn

---

### Del 1: Titel och cirkel högst upp

**Nuvarande problem:**
Korten använder `flex items-center` vilket centrerar innehållet vertikalt. När ett kort har stor höjd (t.ex. 2 timmar) hamnar titeln i mitten.

**Lösning:**
Ändra från `items-center` till `items-start` för att placera innehållet högst upp.

**Fil**: `src/components/calendar/CalendarItemList.tsx`

```tsx
// Task-kort (rad 213-214) - ändra items-center till items-start
className={cn(
  'rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-start gap-3 relative',
  // ...
)}

// Note-kort (rad 291-292) - samma ändring
className={cn(
  'rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-start gap-2',
  // ...
)}

// Event-kort behåller som det är (redan korrekt struktur)
```

---

### Del 2: Hantering av överlappande objekt

**Nuvarande problem:**
Alla tidsobjekt placeras med `left-0 right-0`, så överlappande objekt ligger helt ovanpå varandra.

**Designförslag - Kolumnbaserad layout (Apple Calendar-stil):**

```text
┌─────────────────────────────────────────────────────────┐
│ 09:00 │ ┌─────────────┐ ┌─────────────┐                 │
│       │ │  Meeting    │ │  Call       │                 │
│       │ │  9-10       │ │  9-9:30     │                 │
│ 10:00 │ └─────────────┘ └─────────────┘                 │
│       │ ┌───────────────────────────────┐               │
│       │ │  Focus work 10-12             │               │ ← Full bredd när ensam
│       │ │                               │               │
│ 12:00 │ └───────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

**Algoritm:**
1. Gruppera objekt som överlappar i tid
2. Tilldela varje objekt en "kolumn" (0, 1, 2...)
3. Beräkna bredd och horisontell position baserat på antal kolumner i gruppen

**Implementation:**

```tsx
// Beräkna överlappande grupper och kolumner
const getOverlapColumns = (items: TimedItem[]) => {
  const columns: Map<string, { column: number; totalColumns: number }> = new Map();
  
  // Sortera efter starttid
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  
  // Hitta överlappande grupper
  const groups: TimedItem[][] = [];
  let currentGroup: TimedItem[] = [];
  
  sorted.forEach((item) => {
    const itemEnd = item.endTime || addMinutes(item.time, 30);
    
    // Kolla om detta item överlappar med något i current group
    const overlaps = currentGroup.some(existing => {
      const existingEnd = existing.endTime || addMinutes(existing.time, 30);
      return item.time < existingEnd && itemEnd > existing.time;
    });
    
    if (overlaps || currentGroup.length === 0) {
      currentGroup.push(item);
    } else {
      if (currentGroup.length > 0) groups.push(currentGroup);
      currentGroup = [item];
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);
  
  // Tilldela kolumner inom varje grupp
  groups.forEach(group => {
    group.forEach((item, index) => {
      columns.set(item.item.id, { 
        column: index, 
        totalColumns: group.length 
      });
    });
  });
  
  return columns;
};
```

**Rendering med kolumner:**

```tsx
{timedItems.map(({ type, item, time, endTime }) => {
  const top = getTimePosition(time);
  const calculatedEndTime = endTime || addMinutes(time, 30);
  const height = Math.max(getTimePosition(calculatedEndTime) - top, HOUR_HEIGHT * 0.5);
  
  // Hämta kolumninformation
  const colInfo = overlapColumns.get(item.id) || { column: 0, totalColumns: 1 };
  const width = 100 / colInfo.totalColumns;
  const left = colInfo.column * width;
  
  return (
    <div
      key={item.id}
      className="absolute"
      style={{ 
        top, 
        height,
        left: `${left}%`,
        width: `calc(${width}% - 4px)`,  // 4px gap mellan kolumner
      }}
    >
      {renderItemCard(item, type, undefined, undefined, true, true)}
    </div>
  );
})}
```

---

### Visuellt resultat

**Titel högst upp (i höga kort):**
```text
┌──────────────────────────────┐
│ ○ Meeting with client        │  ← Titel och cirkel längst upp
│                              │
│                              │
│                              │
│                              │
└──────────────────────────────┘
```

**Överlappande objekt (2 items samma tid):**
```text
09:00  ┌────────────┐ ┌────────────┐
       │ Meeting    │ │ Call       │
       │            │ └────────────┘
10:00  └────────────┘
       ┌───────────────────────────┐
       │ Focus work                │  ← Full bredd
11:00  └───────────────────────────┘
```

**Överlappande objekt (3 items):**
```text
09:00  ┌────────┐ ┌────────┐ ┌────────┐
       │ Task 1 │ │ Task 2 │ │ Task 3 │
       │        │ │        │ └────────┘
10:00  └────────┘ └────────┘
```

---

### Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/components/calendar/CalendarItemList.tsx` | 1. Ändra `items-center` till `items-start` på task/note-kort |
| `src/components/calendar/CalendarItemList.tsx` | 2. Lägg till `getOverlapColumns` funktion |
| `src/components/calendar/CalendarItemList.tsx` | 3. Uppdatera timeline-rendering med dynamisk bredd/position |

---

### Designfördelar

- **Tydlighet**: Alla överlappande objekt syns samtidigt
- **Modern**: Samma approach som Apple Calendar och Google Calendar
- **Responsivt**: Anpassar sig automatiskt till antal överlappande objekt
- **Liten gap**: 4px mellanrum mellan kolumner för tydlig separation
- **Stilren**: Behåller avrundade hörn och mjuka färger

