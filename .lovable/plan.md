

## Problem
Sticky note-editorn använder `/60` (60% opacity) på bakgrundsfärgen, vilket gör den genomskinlig när den öppnas från kalendern.

## Lösning
Ändra `getStickyBgClass` i `StickyNoteEditor.tsx` — byt alla `/60` till full opacitet (ta bort `/60`).

### Fil: `src/components/notes/StickyNoteEditor.tsx`

Uppdatera `getStickyBgClass`-funktionen: ändra alla `bg-pastel-X/60` till `bg-pastel-X` (12 ställen, inklusive default-värdet och fallback).

