

## Plan: Fixa tre problem med Task/Note-tidshantering och tidslinje

### Översikt
Tre problem att lösa:
1. Task tid-input är svår att interagera med (Notes har bättre design)
2. Saknas "All day"-knapp för att återställa tid på både Tasks och Notes
3. Tidslinje-objekt fyller inte upp sin tilldelade höjd (10:00-12:00 visas litet)

---

### Problem 1: Förbättra Task tid-input (matcha Notes-designen)

**Nuvarande design (TaskEditPanel):**
- Tid-input sitter i en popover med bara ett `<input type="time">` 
- Svårt att interagera med på mobil
- Separata knappar för starttid och sluttid

**Notes-designen (CalendarNoteModal):**
- En toggle-knapp som visar "All day" eller tiden
- När tidsläge är aktivt: två inline tid-inputs (start och slut) synliga direkt
- Enklare och tydligare UX

**Lösning:** Ändra TaskEditPanel till samma design som CalendarNoteModal:
- Ersätt popover-baserade tid-inputs med inline tid-inputs
- En knapp för att toggla mellan "All day" och tidsläge
- När tidsläge är aktivt: visa två tid-inputs direkt (start - slut)

**Fil**: `src/components/tasks/TaskEditPanel.tsx`

```tsx
// Ny state för isAllDay
const [isAllDay, setIsAllDay] = useState(!task.time);

// Ny toggle-funktion
const handleTimeToggle = () => {
  if (isAllDay) {
    setIsAllDay(false);
    handleTimeChange('09:00');
  } else {
    setIsAllDay(true);
    handleTimeChange('');
  }
};

// UI: Ersätt tid-popover med toggle-knapp + inline inputs
<button onClick={handleTimeToggle} className={cn(...)}>
  <Clock className="w-3.5 h-3.5" />
  {isAllDay ? 'Time' : (task.time || '09:00')}
</button>

{/* Visa tid-inputs när inte all day */}
{!isAllDay && (
  <div className="flex items-center gap-2">
    <input type="time" value={tempTime} onChange={...} className="..." />
    <span>-</span>
    <input type="time" value={tempEndTime} onChange={...} className="..." />
  </div>
)}
```

---

### Problem 2: "All day"-knapp för att återställa tid

**Nuvarande beteende:**
- TaskEditPanel: Ingen knapp för att ta bort tid och återgå till "all day"
- CalendarNoteModal: Har toggle men kunde vara tydligare

**Lösning:**
- **TaskEditPanel**: Lägg till explicit möjlighet att återställa till "all day" (löses automatiskt med problem 1-lösningen - toggle-knappen)
- **CalendarNoteModal**: Redan implementerat med toggle, men förtydliga att det fungerar som "återställ"

Funktionaliteten löses genom att toggle-knappen i problem 1 fungerar som "All day"-knapp när man klickar på den igen.

---

### Problem 3: Tidslinje-objekt fyller inte höjden

**Nuvarande problem:**
Containern har rätt höjd (t.ex. 120px för 2 timmar), men kortet inuti har fast padding (`p-2`) och expanderar inte för att fylla containern.

**Lösning:**
Lägg till `h-full` på kort-elementen när de renderas i timeline-läge, så de fyller sin container.

**Fil**: `src/components/calendar/CalendarItemList.tsx`

```tsx
// Lägg till parameter för att indikera timeline-rendering
const renderItemCard = useCallback((
  item: CalendarEvent | Task | Note, 
  type: 'event' | 'task' | 'note',
  time?: string,
  endTime?: string,
  compact?: boolean,
  fillHeight?: boolean  // NY parameter
) => {
  // ...

  // Task-kortet:
  <div className={cn(
    'rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center gap-3 relative',
    task.completed ? 'bg-secondary' : getColorCardClass(color),
    compact ? 'p-2' : 'p-3',
    fillHeight && 'h-full',  // NY: fyller höjden
    isDragging && 'opacity-50 scale-95'
  )}>

  // Samma för event och note...
});

// Uppdatera anropet i timeline-renderingen:
{timedItems.map(({ type, item, time, endTime }) => {
  // ...
  return (
    <div key={item.id} className="absolute left-0 right-0" style={{ top, height }}>
      {renderItemCard(item, type, undefined, undefined, true, true)}  
      {/* NY: fillHeight=true */}
    </div>
  );
})}
```

---

### Sammanfattning av ändringar

| Fil | Ändring |
|-----|---------|
| `src/components/tasks/TaskEditPanel.tsx` | Ersätt popover-tid-inputs med toggle-knapp + inline inputs (som Notes) |
| `src/components/calendar/CalendarItemList.tsx` | Lägg till `h-full` på kort i tidslinje-vy |

---

### Visuellt resultat

**TaskEditPanel (efter):**
```text
┌────────────────────────────────────────────────────────────┐
│ Edit Task                                              [X] │
├────────────────────────────────────────────────────────────┤
│ [Work] [Jan 27] [⏰ Time]  [Hide] [Delete]                 │
│                                                            │
│ Klick på "Time" → ändras till:                            │
│                                                            │
│ [Work] [Jan 27] [⏰ 09:00] [Hide] [Delete]                 │
│                 [09:00] - [10:00]  ← Inline inputs        │
│                                                            │
│ Klick på tiden igen → återställer till "All day"          │
└────────────────────────────────────────────────────────────┘
```

**Tidslinje (efter):**
```text
10:00 ┃ ┌──────────────────────────────────────┐
      ┃ │                                      │
      ┃ │     Task 10:00 - 12:00               │  ← Fyller hela höjden
      ┃ │                                      │
12:00 ┃ └──────────────────────────────────────┘
```

