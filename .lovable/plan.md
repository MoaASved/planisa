

## Fix: Tidsinput i CreateEventModal och EditEventModal -- gör som i resten av appen

### Problem

CreateEventModal och EditEventModal döljer webbläsarens inbyggda tidsväljare med `[&::-webkit-calendar-picker-indicator]:opacity-0` och `[&::-webkit-calendar-picker-indicator]:absolute`. Det gör att inputen kollapsar till noll bredd på iOS och blir omöjlig att trycka på.

I CalendarNoteModal och NoteEditor (som fungerar på mobil) används vanliga `input[type="time"]` utan att dölja native-indikatorn.

### Lösning

Byt till samma enkla mönster som redan fungerar i CalendarNoteModal -- ren `input[type="time"]` med enkel styling, utan dolda indikatorer, utan refs, utan `onClick`-handlers.

### Tekniska detaljer

**Fil 1: `src/components/modals/CreateEventModal.tsx`**

Ersätt hela tids-blocket (rad 149-166) med:

```tsx
{!isAllDay && (
  <div className="flex items-center gap-2">
    <input
      type="time"
      value={startTime}
      onChange={(e) => handleStartTimeChange(e.target.value)}
      className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
    />
    <span className="text-muted-foreground text-sm">-</span>
    <input
      type="time"
      value={endTime}
      onChange={(e) => handleEndTimeChange(e.target.value)}
      className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-sm border-0 outline-none text-foreground"
    />
  </div>
)}
```

Ta även bort `startTimeRef` och `endTimeRef` från komponentens refs (de behövs inte längre).

**Fil 2: `src/components/modals/EditEventModal.tsx`**

Exakt samma ändring -- byt tids-blocket till enkla inputs utan dolda indikatorer, utan wrapper-divs med onClick-handlers, utan refs.

**Fil 3: `src/components/tasks/TaskEditPanel.tsx`**

Samma ändring -- byt till enkla inputs som matchar CalendarNoteModal-mönstret.

### Varför detta fungerar

- Webbläsarens native tidsväljare visas och är klickbar direkt -- ingen `showPicker()` behövs
- Inputen har alltid bredd tack vare `flex-1` och att native-indikatorn inte är dold
- Matchar exakt det mönster som redan fungerar i CalendarNoteModal och NoteEditor
- Containrarna förblir slimma med `py-2.5`

