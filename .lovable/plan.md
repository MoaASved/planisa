

## Ta bort list view för Folders & Notebooks

### Problem
Layout-toggle (grid/list) syns på alla 4 flikar. Användaren vill bara behålla den för Notes & Sticky — Folders och Notebooks ska alltid vara grid.

### Ändring i `src/components/views/NotesView.tsx`

**1. Dölj toggle-knappen på Folders & Notebooks (rad 319–325)**
Wrappa toggle-knappen i ett villkor:
```tsx
{(viewTab === 'notes' || viewTab === 'sticky') && (
  <button onClick={() => setLayoutMode(...)}>...</button>
)}
```

**2. Tvinga grid-rendering i Folders & Notebooks**
- Notebooks-sektionen (~rad 370–380): rendera alltid `NotebookCard` (grid), aldrig `NotebookListCard`.
- Folders-sektionen (~rad 525–530): rendera alltid `FolderGridCard`, aldrig `FolderListCard`.

Detta gör att även om `layoutMode` råkar vara `'list'` (från tidigare val på Notes-fliken) så visas Folders/Notebooks alltid i grid.

### Inga filer tas bort
`FolderListCard.tsx` och `NotebookListCard.tsx` ligger kvar (oanvända, men inga andra referenser ska brytas). Vill du att jag städar bort dem helt också?

### En fil ändras
`src/components/views/NotesView.tsx`

