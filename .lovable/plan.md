

## Light Mode visuell polish: skuggor, djup, ytor

### Diagnos
1. **Folder-skuggor i Notes** — `FolderGridCard` använder `filter: drop-shadow(...) drop-shadow(...)` på en SVG med transform `rotate()` på inner-papers + clipPath. Dubbla drop-shadows på SVG ger ojämn rendering, särskilt under scroll (varje element skuggas separat istället för silhuetten). Detta är boven.
2. **Skarp linje under scroll** — `NotebookListCard` har en `4px` färg-stripe via en `8px wide` div med `borderRadius: '4px 0 0 4px'` inuti `overflow-hidden` parent — på vissa skärmar kan kanten ge en hårlinje. Mer troligt: `border border-border` på `bg-card` + Tailwind shadow rendering ger 1px gränslinje i kontrast med bakgrunden vid scroll. Även sticky note `rotate-1/-rotate-2` skapar transformerade kanter.
3. **Stone försvinner** — `--pastel-stone: 40 18% 91%` (#ECE9E2) ligger nästan på `--background: 30 20% 98%` (#FBF9F6). Skillnad ~7% lightness — för lite. Folder är dessutom enbart fyllning utan border.
4. **Inkonsekventa skuggor** — minst 5 olika skuggsystem i bruk: `--shadow-soft/card/elevated`, `shadow-md/lg/xl/2xl`, inline `boxShadow`, `filter: drop-shadow`.

### Lösning

**1. Förfina shadow-tokens (`src/index.css`)** — sänk opacity, varmare ton, en konsekvent elevation-skala:
```css
--shadow-soft:     0 1px 2px 0 hsl(30 10% 10% / 0.04);
--shadow-card:     0 1px 2px 0 hsl(30 10% 10% / 0.04), 0 4px 12px -4px hsl(30 10% 10% / 0.06);
--shadow-elevated: 0 2px 4px -1px hsl(30 10% 10% / 0.05), 0 12px 24px -6px hsl(30 10% 10% / 0.10);
--shadow-nav:      0 8px 24px -6px hsl(30 10% 10% / 0.12);
```

**2. Justera Stone (light) för synlighet**:
```css
--pastel-stone: 38 16% 86%;  /* från 91% → 86%, +5% mörkare för separation från bg */
```

**3. `FolderGridCard.tsx`** — ersätt `drop-shadow` på SVG-button med en `box-shadow` på en wrapper-div som matchar folderns silhuett (rektangulär bounding box duger visuellt, mjukare och konsekvent under scroll). Ta bort dubbel drop-shadow. Lägg till subtil 1px inner-stroke i SVG path för Stone/ljusa folders så kanten alltid syns:
```tsx
<button style={{}} className="...">
  <div style={{ filter: 'drop-shadow(0 6px 14px rgba(20,18,15,0.10))' }}>
    <svg>... <path stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill={color} /> ...</svg>
  </div>
</button>
```
En enda drop-shadow på wrapper, inte två. Lägg till `stroke` på huvud-rect/path för edge-definition.

**4. `StickyNoteCard.tsx`** — ta bort `rotate-1/-rotate-2/rotate-2` random rotation (orsakar skarpa kanter mot bakgrund vid scroll och känns inte "premium/Apple"). Behåll bara en mycket subtil skugga via `--shadow-card`. Byt `shadow-md hover:shadow-lg` → `shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]`.

**5. `NotebookListCard.tsx`** — byt inline `boxShadow: '0 2px 8px rgba(0,0,0,0.07)'` → `var(--shadow-card)`. Ta bort `border-radius: '4px 0 0 4px'` på inner-stripe (parent har redan `overflow-hidden` + `rounded-[14px]`, dubbel rounding kan ge artifakt).

**6. `NotebookCard.tsx`** — `boxShadow: '0 4px 16px rgba(0,0,0,0.12)'` → `var(--shadow-elevated)`.

**7. `NoteCard` i `NotesView.tsx`** — `shadow-sm hover:shadow-md` → `shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]`. För Stone-bakgrunder lägg till `border border-black/[0.04]` så kanten finns kvar.

**8. Globalt scroll-artifakt-fix (`src/index.css`)** — lägg till:
```css
html, body { overflow-x: hidden; }
* { -webkit-tap-highlight-color: transparent; }
.sticky-note-card, .flow-card, .flow-widget { transform: translateZ(0); backface-visibility: hidden; }
```
Force GPU layer eliminerar 1px sub-pixel seams under scroll.

**9. FAB & nav-skuggor** — `flow-fab` använder `--shadow-elevated` (uppdateras automatiskt). `flow-nav-floating` skugga sänks något:
```css
box-shadow: 0 6px 24px -6px rgba(0,0,0,0.25), 0 2px 6px -2px rgba(0,0,0,0.15);
```

**10. Modal/sheet-skuggor** — `bg-card rounded-[20px] shadow-xl` (i modaler) → `shadow-[var(--shadow-elevated)]` för konsekvens.

### Filer som ändras
- `src/index.css` — shadow tokens, Stone justering, GPU-layer utility, nav skugga
- `src/components/notes/FolderGridCard.tsx` — singel drop-shadow + 1px stroke
- `src/components/notes/StickyNoteCard.tsx` — ta bort rotation, använd shadow tokens
- `src/components/notes/NotebookCard.tsx` — använd shadow tokens
- `src/components/notes/NotebookListCard.tsx` — shadow tokens, fix stripe border-radius
- `src/components/notes/FolderListCard.tsx` — shadow tokens
- `src/components/views/NotesView.tsx` — NoteCard shadows, modal shadows

### Lämnas orört
- Pastellfärger (utöver Stone) — användaren har redan godkänt dem
- `shadow-2xl` i kontextuella popovers (TaskRow) — de är intentionella floating menus
- Dark mode skuggor

