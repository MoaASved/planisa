
## Två fixar i Tasks-vyn

### Problem 1: Pinnade listor visar `ListChecks`-ikon
Pinnade vanliga listor i Smart List-rutnätet renderas med `ListChecks`-ikonen i en färgad cirkel. Användaren vill att vanliga pinnade listor bara ska visa en färgad cirkel (samma färgcirkel som i `MyListRow` nedanför) — INTE en ikon. Priority/Today behåller sina ikoner.

### Problem 2: "Pin a list / Long-press a list to pin"-platshållarna ser stökiga ut
När inga listor är pinnade visas två tomma `SmartListCard`-platshållare med text. Användaren vill att tomma slots försvinner helt — Priority + Today står kvar och My Lists hamnar närmare.

### Lösning

**A. `SmartListCard.tsx`** — gör `icon` valfri och stöd "dot only"-läge:
- Ändra `icon: LucideIcon` → `icon?: LucideIcon`
- Lägg till valfri prop `dotOnly?: boolean`
- I render: om `dotOnly` ELLER ingen `icon`, visa en mindre fylld färgcirkel (`w-3.5 h-3.5 rounded-full bg-pastel-{color}`) i stället för ikon-cirkeln (`w-9 h-9` containern). Layout/höjd behålls genom att cirkeln sitter i samma flex-slot.

**B. `TasksView.tsx`**
- Pinnade slots: rendera `SmartListCard` med `dotOnly` (utan `icon`-prop) — bara färgcirkel + namn + count.
- Ta bort tomma platshållarna helt: ändra `pinnedSlots` → bara `pinned` (filtrera ut nulls). Rutnätet blir `grid-cols-2`; om bara Priority+Today finns → en rad, om 1 pin → 3 kort, om 2 pins → 2 rader. Inget "Pin a list"-kort.

### Resultat
- Pinnade listor visar färgad prick (matchar `MyListRow`).
- Inga stökiga platshållare när inget är pinnat — My Lists hamnar närmare.
- Priority/Today oförändrade.

### Filer
- `src/components/tasks/SmartListCard.tsx`
- `src/components/views/TasksView.tsx`
