

## Behåll identisk layout på alla 4 flikar

### Problem
När toggle-knappen tas bort helt från DOM på Folders/Notebooks "hoppar" search-ikonen och övriga element flyttas. Designen ska vara visuellt identisk.

### Lösning
I `src/components/views/NotesView.tsx` (rad 320–327): istället för att villkorligt rendera knappen, rendera alltid en platshållare med samma storlek (`w-8 h-8`) på Folders/Notebooks så att layouten förblir identisk.

**Före:**
```tsx
{(viewTab === 'notes' || viewTab === 'sticky') && (
  <button onClick={...}>...</button>
)}
```

**Efter:**
```tsx
{(viewTab === 'notes' || viewTab === 'sticky') ? (
  <button onClick={() => setLayoutMode(...)} className="w-8 h-8 ...">
    {layoutMode === 'list' ? <LayoutGrid/> : <LayoutList/>}
  </button>
) : (
  <div className="w-8 h-8" aria-hidden="true" />
)}
```

### Resultat
- Folders och Notebooks: tomt utrymme där toggle-ikonen brukar vara (search-ikonen stannar i samma position).
- Notes och Sticky: oförändrat.
- Spacing, tab-rad och search-ikonens position blir identiska över alla 4 flikar.

### En fil ändras
`src/components/views/NotesView.tsx` (rad 320–327).

