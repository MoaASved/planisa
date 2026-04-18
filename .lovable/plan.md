
## Ändra list-cirkeln till accent-färg

### Problem
I `ListDetailView.tsx` rad 188 använder cirkeln bredvid list-titeln `bg-pastel-${category.color}` (Light-färgen). Den blir för svag mot vit bakgrund.

### Lösning
Byt till accent-varianten: `bg-pastel-${category.color}-accent` — samma mönster som vi redan använder i `MyListRow.tsx`.

### Fil
- `src/components/tasks/ListDetailView.tsx` rad 188 — `bg-pastel-${category.color}` → `bg-pastel-${category.color}-accent`
