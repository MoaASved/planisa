

## Kompakt Edit Task — iOS Reminders + Sticky Note-stil

### Mål
Riv ut den långa fält-listan i `AddTaskModal` och ersätt med en ren, kompakt modal: titel + add-on-demand note/subtask, och en ikon-rad i botten där varje ikon expanderar till en pill med valt värde.

### Ny layout

```
┌─────────────────────────────────┐
│                            ✕   │
│                                 │
│  Task title_                    │  ← stor, fokuserad
│                                 │
│  + Add note                     │  ← klickbar tills man fyller
│  + Add subtask                  │
│                                 │
│  ─────────────────────────────  │
│  📋 Work   ⭐   📅 Apr 22 14:00│  ← ikon→pill rad
│                                 │
│           [  Save  ]      🗑    │
└─────────────────────────────────┘
```

### Beteenden

**1. Note & Subtask — on demand**
- Visa bara `+ Add note` och `+ Add subtask` initialt.
- Tap på `+ Add note` → liten textarea fadar in, autofocus.
- Tap på `+ Add subtask` → en rad med `•` + input fadar in. När man trycker Enter på en subtask läggs nästa till automatiskt; tomt + Enter stänger.
- Om note tomt vid save → tas bort (visas som `+ Add note` igen nästa gång).

**2. Ikon-rad i botten — pill-expansion**
Tre ikoner i botten med horisontell scroll om de växer:

- **📋 List** — alltid synlig som pill med listans färgcirkel + namn (default är vald lista). Tap → kompakt popover med listval (samma stil som FolderPickerSheet).
- **⭐ Priority** — ikon-toggle. När aktiv: gul fyllning, ingen extra text.
- **📅 Date** — börjar som ren ikon. Tap → öppnar **inline picker-popover** (se nedan). När datum valt blir det en pill: `Apr 22` eller `Apr 22 · 14:00–14:30`. Tap på pill öppnar samma picker. Långt tryck eller liten ✕ inuti pillen rensar.

**3. Date/Time picker (matchar Sticky Note-mönstret)**
Popover som öppnas under date-ikonen:

```
┌────────────────────────┐
│ ┌──────┐  –  ┌──────┐  │  ← två ljusgrå time-fält
│ │ --:--│     │ --:--│  │     blir aktiva vid tap
│ └──────┘     └──────┘  │     (auto +30 min på end)
│                        │
│   [  Apr 2026   < > ]  │  ← månadsvy
│   M T W T F S S        │
│   1 2 3 4 5 6 7        │
│   ...                  │
│                        │
│        Clear date      │
└────────────────────────┘
```

- Time-fälten är ljusgrå (`bg-secondary/50 text-muted-foreground`) tills tap → använder native `<input type="time">` (per memory-regel).
- När start-tid sätts → end-tid auto +30 min (samma `addMinutes`-helper som finns).
- Manuell ändring av end-tid markeras som "manual" så auto-räkning inte skriver över.
- Tömma start-tid → tömmer end-tid också.
- Datum först → bara datum sparas. Tid lägger till tid på det datumet.

**4. Live-sync till kalender**
Befintlig `updateTask` i Zustand triggar redan re-render — ingen ny sync-kod behövs. Behåll all-day-placering vid endast datum, timeline-block vid datum+tid.

### Tekniska filer

- **`src/components/tasks/AddTaskModal.tsx`** — full rewrite av layouten:
  - Ta bort de 6 staplade `bg-secondary`-rader (List/Date/Time/Ends/Priority).
  - Ny ikon-rad i botten med pill-expansion-logik.
  - State för `showNote` / `showSubtaskInput` (på demand).
  - Inkapsla date/time-picker i en lokal `<DateTimePopover>`-komponent (eller inline med shadcn `Popover` + `Calendar`).
  - Behåll all befintlig save-logik, payload-struktur, `endTimeManual`-ref och `addMinutes`-helper.

- Ingen ändring i `useAppStore`, `CalendarView` eller `TaskCell`.

### Resultat
- Renare initial vy: bara titel + två + Add-rader.
- Ikon-rad gör tunga val tillgängliga utan att ta plats.
- Date/time fungerar exakt som sticky notes → konsekvent i hela appen.
- Snabbare, modernare, mer iOS Reminders-likt.

