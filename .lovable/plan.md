
## Lägg till "Rename" på sektioner i list-detalj

### Nuläge
I `ListDetailView.tsx` triggar `onMenu` på `SectionHeader` direkt en `window.confirm` för radering. Ingen möjlighet att byta namn.

### Lösning
Ersätt direkt-radering med en liten popover-meny (samma stil som list-menyn högst upp i `ListDetailView` — `bg-card rounded-2xl shadow-2xl border border-border/40`) med två val:
- **Rename** (Pencil-ikon) → växlar sektionen till inline-edit-läge
- **Delete** (Trash2-ikon, destructive färg) → raderar direkt (enligt memory: ingen confirm-toast)

### Inline rename
När "Rename" väljs ersätts `SectionHeader`-titeln av ett input-fält (samma stil som "new section"-inputen längre ner — `bg-secondary rounded-lg px-3 py-2 text-[16px] font-semibold tracking-tight`). Enter/blur sparar via `updateTaskSection(id, { name })`. Escape avbryter.

### Implementation
**`ListDetailView.tsx`**
- Ny state: `sectionMenuId: string | null` och `renamingSectionId: string | null` + `renameValue: string`.
- Byt `onMenu`-handlern på `SectionHeader` till att öppna popover istället för confirm.
- Rendera popover-menyn absolut-positionerad nära knappen (samma mönster som list-menyn).
- När `renamingSectionId === section.id` → rendera input istället för `SectionHeader`.
- Klick utanför popover stänger den (overlay eller onClick på bakgrund).

**`SectionHeader.tsx`**
- Ingen ändring behövs — `onMenu`-callbacken hanteras av parent.

### Design-konsistens
- Popover: matchar list-menyn (samma rounded-2xl, shadow, border, padding).
- Ikoner: `Pencil` 4x4 muted för rename, `Trash2` 4x4 destructive för delete.
- Ingen confirm-dialog för radering (per memory `no-deletion-confirmation-toast`).
- Input-stil för rename matchar befintlig "new section"-input för konsistens.

### Filer
- `src/components/tasks/ListDetailView.tsx` — popover-meny + inline rename-state
