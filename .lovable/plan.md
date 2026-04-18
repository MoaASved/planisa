

## Plan: Stäng tre-prickar-menyn vid klick utanför

### Problem
Inne i en lista (`ListDetailView`), när man öppnat menyn via tre prickar uppe till höger, kan den för närvarande inte stängas genom att klicka utanför. Endast klick på själva tre-prickar-knappen stänger den.

### Lösning
- Lägg till outside-click-detektering i `ListDetailView.tsx` för menyn
- Klick på samma tre-prickar-knapp → toggle (öppnar/stänger) som idag
- Klick var som helst utanför menyn och knappen → stäng menyn
- Klick inuti menyn (t.ex. på menyalternativ) → fungerar som vanligt

### Implementation
- `useRef` på menyns container + på trigger-knappen
- `useEffect` med `document.addEventListener('mousedown')` när menyn är öppen
- Om klicket inte är inom menyn ELLER trigger-knappen → sätt `menuOpen` till `false`
- Cleanup vid unmount/close

### Fil
- `src/components/tasks/ListDetailView.tsx`

