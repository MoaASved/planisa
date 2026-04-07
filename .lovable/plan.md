

## Problem
Textarea har `autoFocus` vilket fäller upp tangentbordet direkt. Sticky noten är centrerad vertikalt (`top-1/2 -translate-y-1/2`) och flyttas inte när tangentbordet visas.

## Lösning

### Fil: `src/components/notes/StickyNoteEditor.tsx`

1. **Ta bort `autoFocus`** från textarea (rad 155) — tangentbordet öppnas först när användaren klickar på textfältet.

2. **Flytta upp sticky noten när tangentbordet visas** — använd `VisualViewport` API (samma mönster som NoteEditor):
   - Lägg till en `useEffect` som lyssnar på `window.visualViewport` resize-events
   - Beräkna om tangentbordet är uppe (viewport-höjd < fönsterhöjd)
   - Spara offset i state och applicera som `top`-style istället för `top-1/2 -translate-y-1/2`
   - När tangentbordet är uppe: centrera sticky noten i den synliga ytan ovanför tangentbordet
   - När tangentbordet stängs: återgå till centrerad position

### Teknisk detalj
```tsx
// State
const [keyboardOffset, setKeyboardOffset] = useState(0);

// Effect: listen to VisualViewport
useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const handler = () => {
    const keyboardHeight = window.innerHeight - vv.height;
    setKeyboardOffset(keyboardHeight > 50 ? keyboardHeight : 0);
  };
  vv.addEventListener('resize', handler);
  return () => vv.removeEventListener('resize', handler);
}, []);

// Style: shift note up when keyboard is open
style={{
  maxHeight: '70vh',
  top: keyboardOffset > 0
    ? `calc((100vh - ${keyboardOffset}px) / 2)`
    : '50%',
  transform: keyboardOffset > 0 ? 'translateY(-50%)' : 'translateY(-50%)',
}}
```

Ingen ändring i andra filer.

