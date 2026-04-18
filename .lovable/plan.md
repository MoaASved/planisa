

## Plan: Outside-click-blockering på sektionernas tre-prickar-meny

### Problem
Sektionsmenyn (tre prickar bredvid sektionsnamn i `ListDetailView`) använder en enkel `fixed inset-0` overlay som stänger menyn vid klick — men klicket går igenom till underliggande element och kan trigga taps på tasks/knappar.

### Lösning
Återanvänd samma capture-fas-mönster som huvudmenyn (tre prickar uppe till höger):
- Outside-klick stänger **endast** menyn
- Blockerar `pointerdown`, `mousedown`, `touchstart`, `click` i capture-fas
- Klick på samma sektions-knapp togglar (öppna/stäng)
- Klick inuti menyn fungerar som vanligt

### Implementation i `src/components/tasks/ListDetailView.tsx`
- Ta bort nuvarande `fixed inset-0`-overlay för sektionsmenyn
- Lägg till två refs per öppen meny: en map/ref för menycontainer och triggerknapp för aktiv `sectionMenuId`
  - Enklast: `sectionMenuRef` + `sectionMenuTriggerRef` (bara en kan vara öppen åt gången)
- Lägg till `useEffect` som speglar huvudmenyns logik men reagerar på `sectionMenuId` istället för `showMenu`
  - `swallow`-funktion identisk i beteende: preventDefault + stopPropagation + stopImmediatePropagation utanför, `setSectionMenuId(null)` på pointer/mouse/touch down
- Skicka `triggerRef` ner till `SectionHeader` så den kan binda ref på sin tre-prickar-knapp
  - Lägg till valfri `menuTriggerRef?: React.Ref<HTMLButtonElement>` prop i `SectionHeader.tsx`
- Bind `sectionMenuRef` på den absoluta meny-`div`:en i `ListDetailView`

### Filer
- `src/components/tasks/ListDetailView.tsx`
- `src/components/tasks/SectionHeader.tsx` (lägg till `menuTriggerRef` prop)

