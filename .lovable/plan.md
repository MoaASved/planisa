
# Kalender - Visuella förbättringar

## Vad som ska göras

### 1. Beige bakgrund i övre sektionen
Både `MonthView.tsx` och `WeekDayView.tsx` har idag `bg-background` på kalender-grid-sektionen, vilket i teorin redan är korrekt. Men `CalendarHeader.tsx` behöver kontrolleras och säkerställas att den också använder `bg-background` utan någon vit override.

### 2. Top-fade när man scrollar (i nedre sektionen)
För alla tre scroll-containrar i `CalendarItemList.tsx`:

- **Listvy** – `ListScrollContainer` (rad 85–119): Redan har bottom-fade. Lägg till en top-fade som visas när `scrollTop > 0` (dvs. användaren har scrollat ner och kort försvunnit uppåt).

- **Tidslinje-vy** – `<div ref={timelineRef}>` (rad 487): Denna är just nu ett vanligt scroll-element utan fade-logik. Wrap:as i ett nytt container med samma fade-logik (top + bottom).

- **All-day-sektionen** i tidslinjevyn scrollar inte separat, så den behöver ingen fade.

## Tekniska ändringar

### `src/components/calendar/CalendarItemList.tsx`

**Uppdatera `ListScrollContainer`** – lägg till `canScrollUp`-state och top-fade:

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

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={scrollRef} onScroll={checkScroll} ...>
        {children}
      </div>
      {/* Top fade - visas när man scrollat ner */}
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
          height: '70px',
          background: 'linear-gradient(to top, transparent, hsl(30 20% 98%))',
        }} />
      )}
      {/* Bottom fade - visas när mer innehåll finns nedanför */}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
          height: '70px',
          background: 'linear-gradient(to bottom, transparent, hsl(30 20% 98%))',
        }} />
      )}
    </div>
  );
}
```

**Wrap tidslinjevyn** i en ny `TimelineScrollContainer` med samma fade-logik. Tidslinje-containern (rad 487) byter från vanlig `div` med `ref={timelineRef}` till en wrapper som:
- Hanterar scroll-state (up/down)
- Visar top/bottom-fader beroende på scroll-position
- Behåller `ref` för auto-scroll till 07:00

### `src/components/calendar/CalendarHeader.tsx`
Kontrollera och säkerställ att headern har `bg-background` (ingen vit bakgrund).

## Vad som INTE ändras
- All funktionalitet behålls exakt som den är
- Layout, knappar, toggler, filter – allt oförändrat
- Kortens utseende, färger och shadows – oförändrade
- Tidslinjens layout och timme-linjer – oförändrade
