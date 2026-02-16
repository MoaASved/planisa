

## Plan: Visa subtask-raknare pa task-kort i kalendern

### Sammanfattning
Lagga till en kompakt subtask-raknare (t.ex. "1/3") till hoger om titeln pa task-kort i bade listvyn och tidslinje-vyn i kalendern.

---

### Andring

**Fil: `src/components/calendar/CalendarItemList.tsx`**

I `renderItemCard`-funktionen, inuti task-blocket (ca rad 198-222), lagga till en subtask-indikator till hoger om titeln:

- Kontrollera om `task.subtasks.length > 0`
- Om ja, visa `{completed}/{total}` i `text-xs text-muted-foreground` till hoger pa samma rad som titeln
- Anvand flex-layout med `justify-between` sa titeln ar till vanster och raknaren till hoger
- Galler bade compact (timeline) och normal (list) storlek

Visuellt resultat pa kortet:

```text
[O] Handla mat                    1/3
```

Inga andra filer paverkas. Samma renderItemCard-funktion anvands for bade listvyn och tidslinjevyn, sa andringen syns automatiskt i bada.
