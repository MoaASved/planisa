

## Plan: Kompakt datum/tid-sektion i EditEventModal

### Sammanfattning
Gor datum-, all day-, start- och sluttid-sektionen mer kompakt genom att kombinera dem till en tightare layout istallet for att varje falt tar en hel rad.

---

## Andring

**Fil:** `src/components/modals/EditEventModal.tsx` (rad 103-140)

### Nuvarande layout (4 separata block)
1. Date-falt med label (hel rad)
2. All Day toggle (hel rad)
3. Start + End tidsinput (tva kolumner, hel rad)

### Ny kompakt layout

Kombinera allt till ett enda `bg-secondary rounded-xl` block med inre rader:

```text
+----------------------------------------------+
| [Kalenderikon]  2025-02-09          [toggle]  |  <-- Datum + All Day pa samma rad
|----------------------------------------------|
| Start    10:00          End     11:00         |  <-- Tider (visas bara om ej all day)
+----------------------------------------------+
```

**Detaljer:**

- **Rad 1:** Date-input och All Day toggle pa samma rad, separerade med flex justify-between
- **Rad 2:** Start/end tid pa samma rad (visas villkorligt), med en tunn `border-t border-border/20` som separator
- Hela blocket inuti en gemensam `bg-secondary rounded-xl p-3` container
- Ta bort separata labels -- anvand inline-stil istallet
- Mindre padding och typografi for att spara vertikalt utrymme

### Kod

Rad 103-140 ersatts med:

```tsx
<div className="bg-secondary rounded-xl overflow-hidden">
  <div className="flex items-center justify-between p-3">
    <div className="flex items-center gap-2 flex-1">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-transparent border-0 outline-none text-sm font-medium text-foreground"
      />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">All Day</span>
      <button onClick={() => setIsAllDay(!isAllDay)}>
        <div className={cn('w-11 h-6 rounded-full transition-all relative', isAllDay ? 'bg-primary' : 'bg-muted')}>
          <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', isAllDay ? 'left-5' : 'left-0.5')} />
        </div>
      </button>
    </div>
  </div>

  {!isAllDay && (
    <div className="flex items-center gap-3 px-3 pb-3 pt-0">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <input type="time" value={startTime} onChange={...} className="bg-transparent text-sm ..." />
      <span className="text-muted-foreground text-xs">-</span>
      <input type="time" value={endTime} onChange={...} className="bg-transparent text-sm ..." />
    </div>
  )}
</div>
```

---

## Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/modals/EditEventModal.tsx` | Komprimera datum/tid-sektionen till ett enda block |

