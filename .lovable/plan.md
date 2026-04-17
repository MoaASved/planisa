

## Replace färgade prickar med ikoner för Priority & Today

### Problem
I `ListDetailView` header visas en färgad prick (amber/sky) bredvid titeln. För smart views "Priority" och "Today" syns det som en gulaktig/rosa prick — användaren vill ha samma ikon som används i Smart List-korten på Tasks-sidan istället.

### Lösning (`src/components/tasks/ListDetailView.tsx`, rad 171-175)

Ersätt prick-elementet med en villkorlig render:
- Om `category.id === '__priority'` → rendera `<Star className="w-5 h-5 fill-amber-500 text-amber-500" />`
- Om `category.id === '__today'` → rendera `<CalendarIcon className="w-5 h-5 text-sky-500" />` (matchar `CalIcon` i `TasksView`)
- Annars → behåll den befintliga färgade pricken `bg-pastel-${category.color}`

Importera `Star` och `Calendar as CalendarIcon` från `lucide-react`.

### Resultat
- "Priority"-vyn visar en fylld gul stjärna (samma som Priority-markeringen på tasks och Smart List-kortet).
- "Today"-vyn visar en kalenderikon (samma som Smart List-kortet).
- Vanliga listor är oförändrade — färgad prick kvarstår.

### Fil
- `src/components/tasks/ListDetailView.tsx`

