

## Fix: Stable Date popover position + remove native time "Clear"

### Problem
1. **Popover hoppar:** Date-popovern är anchored till date-pillen. När man väljer datum växer pillen från `📅 Date` (~60px) till `📅 Apr 22 ✕` (~110px), vilket Radix kompenserar för genom att flytta hela popovern. Mycket förvirrande.
2. **Native "Clear"-knapp i tidsväljaren:** På vissa webbläsare/mobiler visar `<input type="time">` en inbyggd "nollställ"-knapp i scroll-pickern. Den behövs inte — vi har redan ✕-knappen bredvid time-fälten.

### Lösning (`src/components/tasks/AddTaskModal.tsx`)

**A. Stabil popover-position via PopoverAnchor**
- Importera `PopoverAnchor` från `@/components/ui/popover` (Radix-export — verifiera att den re-exporteras; annars importera direkt från `@radix-ui/react-popover`).
- Wrap hela ikon-raden (`px-5 pb-3 flex...`) eller skapa en osynlig anchor-div med fast bredd som popovern fäster vid istället för pillen.
- Sätt `<PopoverAnchor>` på ett stabilt element (t.ex. själva ikon-raden), behåll `<PopoverTrigger>` på pillen för klick-interaktionen.
- Popovern öppnas alltid på samma plats oavsett om pillen är `Date` eller `Apr 22 · 14:00–14:30`.
- Lägg `sideOffset={8}` och `align="start"` med lite `alignOffset` så den hamnar luftigt under raden, ej i kanten på skärmen.
- Sätt `collisionPadding={16}` så Radix håller ≥16px från viewport-kanten = luftigt på mobil 390px-bredd.

**B. Dölj native "Clear" i `<input type="time">`**
- Lägg en CSS-regel i `src/index.css` som döljer Webkit/Edge native clear-knappen:
```css
input[type="time"]::-webkit-clear-button,
input[type="time"]::-webkit-inner-spin-button { display: none; -webkit-appearance: none; }
```
- Detta påverkar alla time-inputs i appen — vi har redan vår egen ✕ vid time-fälten i AddTaskModal samt liknande i sticky notes, så det är konsekvent.

### Resultat
- Popovern står still som ett berg när man väljer datum — endast pillen byter utseende.
- Bra avstånd från skärmkanten (≥16px), känns luftigt.
- Native "Clear" i tidsväljaren försvinner, ✕-knappen är enda nollställning.

### Filer
- `src/components/tasks/AddTaskModal.tsx` — wrap PopoverAnchor, lägg `collisionPadding` + `sideOffset` på `PopoverContent`.
- `src/index.css` — globalt dölja native clear på time-inputs.
- `src/components/ui/popover.tsx` — verifiera/lägg till `PopoverAnchor`-export om den saknas.

