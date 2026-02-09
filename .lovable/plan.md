

## Plan: Snygga till untimed items i tidslinjevyn

### Sammanfattning
Forbattra layouten for tasks och notes utan tid som visas hogst upp i tidslinjevyn. Gor sektionen mer organiserad med battre spacing, en subtil visuell avskiljare mot tidslinjen, och jamna gap mellan korten.

---

## Andring

**Fil:** `src/components/calendar/CalendarItemList.tsx`

Uppdatera all-day/untimed-sektionen (rad 442-451) med:

1. **Okad padding**: `px-4 pt-3 pb-4` istallet for `px-4 pb-3` -- ger luft bade ovanfor och under
2. **Storre gap i grid**: `gap-3` istallet for `gap-2` -- mer utrymme mellan korten
3. **Subtil separator-linje**: Lagg till en tunn `border-b border-border/30` under sektionen for att visuellt skilja untimed items fran tidslinjen
4. **Row gap**: Anvand `gap-x-3 gap-y-2.5` for att kontrollera horisontellt och vertikalt avstand separat

### Kod (rad 442-451)

Fran:
```
<div className="px-4 pb-3">
  <div className="grid grid-cols-2 gap-2">
```

Till:
```
<div className="px-4 pt-2 pb-4 border-b border-border/20 mb-2">
  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
```

---

## Resultat

- Korten far jamnt avstand bade horisontellt och vertikalt
- En tunn linje skiljer untimed-sektionen fran tidslinjen under
- Lite extra luft ovanfor och under sektionen gor det mer luftigt och organiserat

---

## Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/calendar/CalendarItemList.tsx` | Uppdatera spacing och lagg till separator for untimed items |

