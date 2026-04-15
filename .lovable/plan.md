

## Redesign FolderGridCard — Kortet ÄR mappen

### Vad ändras
Ersätt det nuvarande rektangulära kortet med en form som ser ut som en verklig mapp — med en tab/flik i övre vänster hörn.

### Fil: `src/components/notes/FolderGridCard.tsx`

Hela komponenten skrivs om:

1. **Mappform via SVG clip-path eller SVG-baserad bakgrund**: Kortet renderas som en SVG med en flik (tab) uppe till vänster — liknande en fysisk mapp. Formen blir ungefär:

```text
    ┌──────┐
    │  tab  ╲
┌───┘        └────────────┐
│                         │
│                         │
│  Folder name            │
│  X items            ⋯   │
└─────────────────────────┘
```

2. **Implementering**: Använd en inline SVG som bakgrund med `clipPath` för att skapa mappformen. Färgen från `folder.color` fyller hela formen. En mörkare gradient i botten ger djup.

3. **Text**: Mappnamn (vit, bold, 15px) och "X items" (vit, 12px, 0.75 opacity) placeras nere till vänster.

4. **Tre-punktsmeny (⋯)**: Flyttas till **nedre högra hörnet** (som notebooks har).

5. **Skugga**: `0 4px 16px rgba(0,0,0,0.15)` med `filter: drop-shadow()` på SVG-formen.

6. **Aspekt-ratio**: Behåll liknande proportioner som nu men anpassat till mappformen.

7. **Interaktion**: `active:scale-95` behålls.

### Teknisk approach
Använd CSS `clip-path: polygon(...)` på en div för att skapa tab-formen:
```css
clip-path: polygon(0 12%, 25% 12%, 30% 0, 45% 0, 50% 12%, 100% 12%, 100% 100%, 0 100%);
```
Alternativt en SVG `<path>` om clip-path ger för hårda kanter. Tab-fliken ska ha rundade hörn — SVG-path ger bäst kontroll.

### Inga andra filer ändras
`NotesView.tsx` och `FolderEditModal.tsx` behöver inga ändringar — samma props, samma interaktion.

