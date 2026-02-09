

## Plan: Modern gradient-stripe indikator for timed events

### Sammanfattning
Ersatter den morka vertikala linjen bredvid event-kort med en modern gradient-stripe inuti kortet. Stripen gar fran kategori-fargen till transparent, som ger en elegant glassmorphism-kansla.

---

## Vad andras visuellt

**Fore:** En mork, separat vertikal linje (`bg-foreground/70`) utanfor kortet.

**Efter:** En tunn vertikal gradient-stripe pa vanstersidan *inuti* kortet. Gradient gar fran full kategori-farg till transparent. Kortet far ocksa en rundad vansterkant for att integrera stripen.

---

## Tekniska detaljer

### `src/components/calendar/CalendarItemList.tsx`

**1. Ta bort den separata morka linjen (rad 311-315)**

Den gamla layouten med en separat `div` utanfor kortet tas bort. Istallet laggs gradient-stripen direkt inuti event-kortet.

**2. Lagg till gradient-stripe inuti event-kortet**

Inuti event-kortets `div`, lagg till ett `absolute`-positionerat element med:
- `position: absolute`, ankrad till vansterkanten
- Full hojd, tunn bredd (3px)
- CSS gradient fran kategori-farg (full opacitet) till transparent
- Rundade horn som foljer kortets border-radius

**3. Lagg till ny hjalp-funktion i `src/lib/colors.ts`**

En ny funktion `getColorHex` som returnerar den riktiga CSS-variabeln for en pastellfarg, sa att vi kan anvanda den i inline `background`-styles for gradient.

### Kod-andringar

**`src/lib/colors.ts`** - lagg till:
```tsx
export const getColorVar = (color: PastelColor): string => {
  return `hsl(var(--pastel-${color}))`;
};
```

**`src/components/calendar/CalendarItemList.tsx`** - event-render (rad 308-339):

Fran:
```tsx
<div className={cn("flex items-stretch gap-1.5", fillHeight && "h-full")}>
  {showTimelineIndicator && !showTimeline && (
    <div className="w-1 rounded-full bg-foreground/70 flex-shrink-0" />
  )}
  <div ... className="flex-1 rounded-xl ...">
    ...
  </div>
</div>
```

Till:
```tsx
<div
  onClick={() => onItemClick(event, 'event')}
  className={cn(
    'rounded-xl cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden',
    getColorCardClass(color),
    compact ? 'p-2' : 'p-3',
    showTimelineIndicator && !showTimeline && 'pl-4',
    fillHeight && 'h-full',
    isDragging && 'opacity-50 scale-95'
  )}
>
  {/* Gradient stripe for timed events */}
  {showTimelineIndicator && !showTimeline && (
    <div
      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
      style={{
        background: `linear-gradient(to bottom, ${getColorVar(color)}, transparent)`
      }}
    />
  )}
  <span className={cn('font-medium block truncate', compact ? 'text-xs' : 'text-sm')}>
    {event.title}
  </span>
  {(showTime || fillHeight) && time && (
    <span className="text-xs text-foreground/60">
      {time}{endTime && ` - ${endTime}`}
    </span>
  )}
</div>
```

Layouten forenklas -- ingen yttre wrapper med `gap-1.5` behovs langre. Gradient-stripen lever inuti kortet.

---

## Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/lib/colors.ts` | Lagg till `getColorVar()` hjalp-funktion |
| `src/components/calendar/CalendarItemList.tsx` | Ersatt mork linje med gradient-stripe inuti kortet |

