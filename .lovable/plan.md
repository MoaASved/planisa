

## Fix Date popover: dölj tidsfält tills man vill ha tid + fungerande nollställning

### Problem
1. När man öppnar Date-popovern visas tidsfälten direkt ovanför kalendern. Användaren vill bara se kalendern först.
2. Det finns ingen separat "nollställ tid"-knapp — bara "Clear date" som rensar allt. Att tömma time-fältet manuellt funkar inte tillförlitligt på native picker.

### Lösning (`src/components/tasks/AddTaskModal.tsx`)

**A. Visa kalendern först, tid on-demand**
- Ny lokal state `showTimeFields` (boolean), default `false`.
- När popovern öppnas och task saknar tid → `showTimeFields = false`. Om task redan har `time` → `true`.
- Överst i popovern (när `!showTimeFields`): en kompakt knapp `+ Add time` (klocka-ikon + text), full bredd, `bg-secondary/60`, rounded-lg.
- När man trycker `+ Add time`: `showTimeFields = true` → de två tidsfälten fadar in ovanför kalendern (nuvarande layout).
- När `showTimeFields = true` och tid är satt: visa en liten `✕` (nollställ-tid)-knapp till höger om end-tid-fältet. Klick → `setTime('')`, `setEndTime('')`, `endTimeManual.current = false`, `setShowTimeFields(false)`. Datum behålls.

**B. Bottenknapp-logik**
- Behåll "Clear date" längst ner — men den rensar nu **både datum och tid** (som idag) och stänger popovern. Tydlig avsikt: "ta bort hela datumvalet".
- Den nya `✕`-knappen vid tidsfälten = nollställ bara tid.

**C. Layout i popovern**

```
┌────────────────────────┐
│ [ + Add time         ] │  ← när ingen tid
│                        │
│   April 2026   < >     │
│   M T W T F S S        │
│   ...                  │
│                        │
│   Clear date           │  ← bara om datum valt
└────────────────────────┘

efter tap på + Add time:
┌────────────────────────┐
│ [09:00] – [09:30]  ✕  │  ← ✕ rensar bara tid
│                        │
│   April 2026   < >     │
│   ...                  │
└────────────────────────┘
```

### Resultat
- Renare första intryck: bara kalender + "+ Add time".
- Användaren kan välja bara datum utan att tids-UI är i vägen.
- Tydlig separation: ✕ vid tidsfält rensar tid; "Clear date" rensar allt.
- Ingen ändring i save-logik, calendar sync eller andra filer.

### Fil
- `src/components/tasks/AddTaskModal.tsx` (rader ~34, ~51-82, ~356-417)

