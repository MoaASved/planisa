

## Plan: Ny datum/tid-layout for bade CreateEventModal och EditEventModal

### Problem
1. `[&::-webkit-calendar-picker-indicator]:hidden` gor att man inte kan andra tid pa desktop
2. Start- och sluttid ser ut som ett enda falt, inte tva separata
3. CreateEventModal och EditEventModal har helt olika layout

### Referens
CalendarNoteModal (note-redigering) har den onskvarda stilen: separata `bg-secondary rounded-xl` containrar for start och slut, med en enkel `-` mellan.

### Ny gemensam layout (bade Create och Edit)

```text
+----------------------------------------------+
| [Kalender]  2025-02-09        All Day [tog]  |
+----------------------------------------------+

  [ 10:00        ]  -  [ 11:00        ]
  (bg-secondary)       (bg-secondary)
```

- **Datum + All Day** i ett kompakt `bg-secondary rounded-xl` block (som Edit redan har)
- **Tid** som tva separata `bg-secondary rounded-xl` inputs med `-` mellan (likt CalendarNoteModal)
- Ingen `[&::-webkit-calendar-picker-indicator]:hidden` pa time-inputs -- latt webblasaren visa sin native picker sa det fungerar pa desktop
- Dold native date-ikon behalls (opacity-0 + absolute) sa att man fortfarande kan klicka pa datum

---

### Tekniska detaljer

**Fil 1: `src/components/modals/EditEventModal.tsx`** (rad 103-134)

Ersatt hela datum/tid-blocket med:
- Datum-rad: behall nuvarande layout men fixa indrag
- Tid-sektion: ta bort ur `bg-secondary`-blocket, lagg som egen rad med tva separata `flex-1 bg-secondary rounded-xl px-3 py-2.5` inputs, exakt som CalendarNoteModal rad 128-144
- Ta bort `[&::-webkit-calendar-picker-indicator]:hidden` fran time-inputs

**Fil 2: `src/components/modals/CreateEventModal.tsx`** (rad 123-173)

Ersatt datum-, all day-, och tid-sektionerna med exakt samma layout som EditEventModal:
- Kombinerat datum + all day till ett `bg-secondary rounded-xl` block
- Tid som tva separata `bg-secondary rounded-xl` inputs under
- Behall auto-calculate-logiken for sluttid (handleStartTimeChange/handleEndTimeChange)

### Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/modals/EditEventModal.tsx` | Ny tid-layout med separata containrar, fixa desktop-klickbarhet |
| `src/components/modals/CreateEventModal.tsx` | Matcha samma layout som EditEventModal |

