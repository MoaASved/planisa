

## Plan: Strukturera datum/tid-sektionen i EditEventModal

### Problem
- Pa desktop renderar `<input type="time">` inbyggda klock-ikoner fran webblasaren, sa det syns tre klockor totalt (1 manuell + 2 native)
- Pa mobil syns bara en klocka, men tidsraderna kanns inte uppradade med datumraden ovanfor
- Start/slut-tiderna ar centrerade under ett vansterjusterat datum, vilket ser ostrukturerat ut

### Losning

**Fil:** `src/components/modals/EditEventModal.tsx` (rad 103-132)

1. **Dolj native klock-ikoner** med CSS (`[&::-webkit-calendar-picker-indicator]` doljs via Tailwind-klass) pa bade time- och date-inputs
2. **Rada upp tidsraden under datumraden** sa att start/slut-tiderna borjar pa samma indrag som datumet (efter ikonen)
3. **Lagg till labels** "Start" och "End" som smala text-labels for tydlighet
4. **Anvand samma layout-struktur** pa bada raderna for konsistens

### Ny layout

```text
+----------------------------------------------+
| [Kalender]  2025-02-09        All Day [    ] |
|----------------------------------------------|
| [Klocka]    10:00  –  11:00                  |
+----------------------------------------------+
```

### Andringar i detalj

**Rad 107-112 (date input):** Lagg till klass for att dolj native ikon:
```
className="bg-transparent border-0 outline-none text-sm font-medium text-foreground [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
```

**Rad 124-131 (time section):** Strukturera om sa tiderna ar vansterjusterade med labels:
```tsx
{!isAllDay && (
  <div className="flex items-center gap-3 px-3 pb-3 border-t border-border/20 pt-2">
    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
    <div className="flex items-center gap-2 flex-1">
      <input type="time" value={startTime} onChange={...}
        className="bg-transparent border-0 outline-none text-sm font-medium text-foreground
          [&::-webkit-calendar-picker-indicator]:hidden" />
      <span className="text-muted-foreground text-xs">–</span>
      <input type="time" value={endTime} onChange={...}
        className="bg-transparent border-0 outline-none text-sm font-medium text-foreground
          [&::-webkit-calendar-picker-indicator]:hidden" />
    </div>
  </div>
)}
```

Genom att anvanda `[&::-webkit-calendar-picker-indicator]:hidden` pa time-inputs forsvinner de extra klock-ikonerna pa desktop. Den manuella Clock-ikonen behalls som enda visuella indikator.

---

## Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/modals/EditEventModal.tsx` | Dolj native ikoner, rada upp tid under datum konsekvent |

