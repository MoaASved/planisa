

## Plan: Gradient-stripe i tidslinje + smart eventformular

### Sammanfattning
Tre andringar: (1) gradient-stripe pa event-kort aven i tidslinjevyn, (2) ta bort tidstexten fran kort i tidslinjen, och (3) smartare "Skapa event"-modal med auto-ifyllt datum och automatisk sluttid.

---

## Andring 1: Gradient-stripe i tidslinjevyn

**Fil:** `src/components/calendar/CalendarItemList.tsx`

Idag visas gradient-stripen bara nar tidslinjen ar avstangd (`!showTimeline`). Andringen gor att stripen alltid visas pa event-kort som har tidsintervall -- aven i tidslinjevyn.

- Andring pa rad 320: Ta bort villkoret `&& !showTimeline` fran `pl-4` padding
- Andring pa rad 326: Ta bort villkoret `&& !showTimeline` sa att gradient-div alltid renderas nar `showTimelineIndicator` ar sant

---

## Andring 2: Ta bort tidstexten i tidslinjevyn

**Fil:** `src/components/calendar/CalendarItemList.tsx`

I tidslinjevyn visar tidsrutnatet redan vilken tid ett event ar pa, sa tidstexten inuti korten ar overflodigt. Tiden ska bara visas i listvyn (nar tidslinjen ar avstangd).

- Andring pa rad 337: Andra villkoret fran `(showTime || fillHeight) && time` till `showTime && time` (dvs ta bort `fillHeight` fran villkoret)
- Samma andring for tasks (rad 298) och notes (rad 365) -- ta bort `fillHeight` fran villkoret sa att tid inte visas i timeline-kort

---

## Andring 3: Auto-ifyllt datum och sluttid i CreateEventModal

### 3a. Skicka valt datum till modalen

**Fil:** `src/pages/Index.tsx`

- Lagg till state `selectedCalendarDate` som CalendarView kan uppdatera
- Skicka denna som `initialDate` prop till `CreateEventModal`

**Fil:** `src/components/views/CalendarView.tsx`

- Ta emot en `onDateChange` callback-prop
- Anropa den nar `selectedDate` andras, sa att Index.tsx alltid har det senaste valda datumet

### 3b. Uppdatera CreateEventModal

**Fil:** `src/components/modals/CreateEventModal.tsx`

- Lagg till prop `initialDate?: Date`
- Nar modalen oppnas och `initialDate` finns, formtera den till `YYYY-MM-DD` och satt som default for date-faltet
- Nar anvandaren andrar starttid, berakna automatiskt sluttid som +1 timme:

```text
Starttid: 10:00  -->  Sluttid: 11:00 (auto)
Starttid: 23:00  -->  Sluttid: 23:59 (capped)
```

- Anvandaren kan alltid andra sluttiden manuellt. Auto-berakningen sker bara nar sluttiden inte redan har andrasts manuellt av anvandaren.

---

## Filer som paverkas

| Fil | Atgard |
|-----|--------|
| `src/components/calendar/CalendarItemList.tsx` | Visa gradient-stripe aven i timeline; ta bort tid fran timeline-kort |
| `src/components/modals/CreateEventModal.tsx` | Ta emot `initialDate`, auto-fylla datum och sluttid |
| `src/pages/Index.tsx` | Halla koll pa valt datum, skicka till CreateEventModal |
| `src/components/views/CalendarView.tsx` | Rapportera valt datum uppat via callback |

