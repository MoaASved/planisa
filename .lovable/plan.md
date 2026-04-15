

## Redesign Folders Grid View

### What changes
Create a new `FolderGridCard` component and update the folders grid in `NotesView.tsx`.

### New file: `src/components/notes/FolderGridCard.tsx`
A card component matching `NotebookCard` style but with a folder identity:
- 2-column grid card with `AspectRatio` (1/1.4) like notebooks
- Full colored background using `hsl(var(--pastel-{color}))`
- SVG folder icon in upper-left corner (white, semi-transparent) — the existing macOS-style folder shape, scaled down
- Three-dot menu (MoreHorizontal) in upper-right corner, white
- Bottom gradient overlay (transparent → rgba(0,0,0,0.35))
- Folder name (white, bold, 15px) and "X items" (white, 12px, 0.75 opacity) bottom-left
- Shadow: `0 4px 16px rgba(0,0,0,0.12)`
- `active:scale-95` animation

### Updated file: `src/components/views/NotesView.tsx`
1. Import `FolderGridCard` and `updateFolder`/`deleteFolder` from store
2. Change grid from `grid-cols-3` to `grid-cols-2` for folders
3. Replace inline folder grid button with `<FolderGridCard>`
4. Add state for folder action menu (`actionFolder`, `showFolderActions`)
5. Add folder edit modal (reuse pattern from `NotebookEditModal` — rename, change color, save, delete with confirmation alert)
6. "New Folder" button adapts to 2-col layout

### Three-dot menu actions
Clicking ⋯ opens an action sheet (same pattern as `NotebookActionSheet`) with:
- Rename folder
- Change color
- Save changes
- Delete folder (with confirmation: "Notes in this folder will become unassigned")

On delete: calls `deleteFolder(id)` — notes keep existing but lose their folder assignment (already handled since notes reference folder by name, and unmatched folders just show as "no folder").

### No changes to list view
List view (`FolderListCard`) remains untouched.

