

## Plan: Förenkla drag — håll på själva raden för att flytta

### Beteende
- Inga sex-prickar / drag handles längre (varken på tasks eller lists)
- Håll fingret/musen nedtryckt på en task eller list-rad i ~250 ms → drag aktiveras
- Vanligt klick (kort tryck) → öppnar tasken / listan som vanligt
- Sortering är alltid manuell (ingen sort-dropdown)

### Ändringar

**`src/components/tasks/SortableTaskCell.tsx`**
- Ta bort `<button>` med `GripVertical`
- Lägg `attributes` + `listeners` direkt på wrapper-diven så hela raden blir drag-källa
- Behåll `setNodeRef`, `transform`, `transition`, `isDragging`
- Ta bort prop `draggable` (alltid på)

**`src/components/tasks/SortableMyListRow.tsx`**
- Samma sak: ta bort grip-knapp, lägg listeners på wrapper
- Hela list-raden blir drag-källa

**`src/components/tasks/ListDetailView.tsx`**
- Ta bort eventuell sort-dropdown / "Sorted by:"-text och `sortMode`-state
- Sortera alltid på `(a.order ?? 0) - (b.order ?? 0)`
- Höj PointerSensor `activationConstraint` till `{ delay: 250, tolerance: 5 }` så klick fortfarande öppnar TaskEditPanel utan att starta drag
- `SortableTaskCell` används utan `draggable`-prop

**`src/components/views/TasksView.tsx`**
- Samma sensor-konfiguration: `{ delay: 250, tolerance: 5 }`
- `SortableMyListRow` används som vanligt — hela raden är drag-källa

### Tekniska detaljer
- `delay: 250ms` + `tolerance: 5px` är dnd-kits standardmönster för att skilja klick från drag på både touch och mus
- Inga klick-stopPropagation-trick behövs eftersom listeners ligger på wrappern och kort klick passerar genom till `TaskCell` / `MyListRow` `onClick`
- Cursor på wrappern: `cursor-grab active:cursor-grabbing` (subtilt, valfritt)

### Filer
- `src/components/tasks/SortableTaskCell.tsx`
- `src/components/tasks/SortableMyListRow.tsx`
- `src/components/tasks/ListDetailView.tsx`
- `src/components/views/TasksView.tsx`

