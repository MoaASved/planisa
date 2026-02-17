
# Kalender – Visuella fixar (görs nu korrekt)

## Problem
De tidigare "ändringarna" sparades aldrig i filerna. Koden är fortfarande i sitt ursprungliga tillstånd och alla tre ändringar måste implementeras från scratch.

## Filer som ändras

### 1. `src/components/calendar/CalendarHeader.tsx`
**Rad 29** – byt `bg-white dark:bg-card` mot `bg-background`:
```
// Innan:
<div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-card">

// Efter:
<div className="flex items-center justify-between px-4 py-3 bg-background">
```

### 2. `src/components/calendar/CalendarItemList.tsx`

**A) `ListScrollContainer` (rad 85–119)** – lägg till `canScrollUp` + top-fade:
```tsx
function ListScrollContainer({ children }) {
  const scrollRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => { checkScroll(); }, [children, checkScroll]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={scrollRef} onScroll={checkScroll} className="h-full overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-2">
        {children}
      </div>
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: '70px', background: 'linear-gradient(to top, transparent, hsl(30 20% 98%))' }} />
      )}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: '70px', background: 'linear-gradient(to bottom, transparent, hsl(30 20% 98%))' }} />
      )}
    </div>
  );
}
```

**B) Tidslinje-vyn (rad 487)** – wrap `div ref={timelineRef}` i en ny container med fade-logik:

Lägg till två nya state-variabler i komponenten:
```tsx
const [timelineCanScrollUp, setTimelineCanScrollUp] = useState(false);
const [timelineCanScrollDown, setTimelineCanScrollDown] = useState(false);
```

Lägg till en `checkTimelineScroll`-funktion och koppla till `useEffect` för auto-scroll:
```tsx
const checkTimelineScroll = useCallback(() => {
  const el = timelineRef.current;
  if (!el) return;
  setTimelineCanScrollUp(el.scrollTop > 4);
  setTimelineCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
}, []);

useEffect(() => {
  if (showTimeline && timelineRef.current) {
    timelineRef.current.scrollTop = 7 * HOUR_HEIGHT;
    checkTimelineScroll();
  }
}, [showTimeline, checkTimelineScroll]);
```

Tidslinjens render-block byter struktur:
```tsx
// Förut:
<div ref={timelineRef} className="flex-1 overflow-y-auto overflow-x-hidden">
  ...
</div>

// Efter:
<div className="flex-1 relative overflow-hidden">
  <div ref={timelineRef} onScroll={checkTimelineScroll} className="absolute inset-0 overflow-y-auto overflow-x-hidden">
    ...
  </div>
  {timelineCanScrollUp && (
    <div className="absolute top-0 left-0 right-0 pointer-events-none"
      style={{ height: '70px', background: 'linear-gradient(to top, transparent, hsl(30 20% 98%))' }} />
  )}
  {timelineCanScrollDown && (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{ height: '70px', background: 'linear-gradient(to bottom, transparent, hsl(30 20% 98%))' }} />
  )}
</div>
```

## Vad som INTE ändras
- All funktionalitet, knappar, filter, layout – oförändrat
- Kortens utseende, färger, shadows – oförändrat
- Tidslinjens timme-linjer och placering – oförändrat
