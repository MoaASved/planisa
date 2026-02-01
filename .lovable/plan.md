

## Plan: Scrolla till toppen efter note-skapande

### Sammanfattning
Lägg till scroll-to-top funktionalitet i NotesView så att användaren hamnar högst upp i listan efter att ha skapat eller redigerat en note.

---

## Ändringar

### `src/components/views/NotesView.tsx`

**1. Lägg till imports och ref (rad 1-2):**
```tsx
import { useState, useRef, useEffect } from 'react';
```

**2. Lägg till scroll ref och state för att tracka när editorn stängs (runt rad 52-53):**
```tsx
const scrollContainerRef = useRef<HTMLDivElement>(null);
const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
```

**3. Lägg till useEffect för scroll-to-top (runt rad 54):**
```tsx
useEffect(() => {
  if (shouldScrollToTop && scrollContainerRef.current) {
    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    setShouldScrollToTop(false);
  }
}, [shouldScrollToTop]);
```

**4. Uppdatera handleCloseEditor (rad 111-117):**
```tsx
const handleCloseEditor = () => {
  setSelectedNote(null);
  setSelectedStickyNote(null);
  setIsCreatingStickyNote(false);
  onEditingChange?.(false);
  onCloseEditor?.();
  setShouldScrollToTop(true); // Trigger scroll to top
};
```

**5. Lägg till ref på scroll-containern (Notes-vyn, rad 496):**
```tsx
<div ref={scrollContainerRef} className="min-h-screen pb-24 overflow-y-auto">
```

**6. Samma ref på Sticky-vyn (rad 347):**
```tsx
<div ref={scrollContainerRef} className="min-h-screen pb-24">
```

---

## Teknisk förklaring

| Koncept | Beskrivning |
|---------|-------------|
| `useRef` | Referens till DOM-elementet för scroll-containern |
| `shouldScrollToTop` | State-flag som triggar scroll när editorn stängs |
| `scrollTo({ top: 0, behavior: 'smooth' })` | Mjuk scroll-animation till toppen |
| `useEffect` | Lyssnar på state-ändringar och utför scroll |

---

## Användarupplevelse

1. Användaren skapar eller redigerar en note
2. Trycker på tillbaka-pilen (sparar automatiskt)
3. Editorn stängs och listan visas
4. Vyn scrollar smidigt till toppen där den nya/uppdaterade noten finns

