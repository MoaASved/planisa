

## Plan: Fixa outside-click på huvudmeny i ListDetailView

### Root cause
I `useEffect` för `showMenu`: när användaren klickar utanför, kör `pointerdown`-handlern `setShowMenu(false)`. React re-renderar → effektens cleanup körs → alla capture-listeners tas bort **innan** browserns efterföljande `click`-event hinner firas. Click-eventet går då obehindrat genom till task-elementet under och triggar det (öppnar task-detaljmodal).

### Lösning
Skjut upp `setShowMenu(false)` så att click-eventet hinner blockeras först:
- I `swallow`: blockera eventet (preventDefault + stopPropagation + stopImmediatePropagation) som idag
- Stäng menyn via `setTimeout(() => setShowMenu(false), 0)` istället för synkront — då hinner click-eventet (samma tick) passera capture-listenern och blockeras innan effekten cleanas
- Alternativt: håll en lokal `closedRef` så listeners förblir aktiva tills också click-eventet för samma sekvens har swallowats, sedan stäng

Enklare och säkrare: `setTimeout(..., 0)` på state-uppdateringen.

### Tillämpa samma fix på sektionsmenyns useEffect
Samma race condition existerar även där — fixa båda.

### Fil
- `src/components/tasks/ListDetailView.tsx` — uppdatera båda `useEffect`-blocken (rader 70-100 och 102-132)

