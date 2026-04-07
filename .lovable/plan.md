

## Problem
Sticky note-editorn saknar möjlighet att välja tid (start/slut) när "Show in calendar" är aktiverat. Datum kan väljas men inte tid.

## Lösning
Lägg till start- och sluttidsfält i kalender-popovern i `StickyNoteEditor.tsx`, med samma stil och smart auto-fill-logik som används i resten av appen.

## Ändringar

### Fil: `src/components/notes/StickyNoteEditor.tsx`

1. **Lägg till state för tid**:
   - `time` (string | undefined) — initieras från `note?.time`
   - `endTime` (string | undefined) — initieras från `note?.endTime`
   - `endTimeManuallySet` (useRef) — för smart auto-fill-logik

2. **Lägg till `calculateEndTime`-funktion**: Samma som i övriga editorer — sätter sluttid till 1 timme efter starttid (max 23:59).

3. **Lägg till tidsinmatning i kalender-popovern**: Under "Show in calendar"-checkboxen och kalendern, visa två `<input type="time">` fält (start och slut) med en separator emellan, när `showInCalendar` är aktiverat. Stilen matchar övriga editorer: `bg-white/30` rundade inputs med standard HTML time-picker.

4. **Spara tid i `handleSave`**: Inkludera `time` och `endTime` i noteData (eller `undefined` om "Show in calendar" är avstängt).

### Ingen ändring i andra filer
Typen `Note` har redan `time` och `endTime`-fält. Kalendervyn hanterar redan notes med tid.

