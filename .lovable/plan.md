
## Tvådelad färgpalett: Light surfaces + Dark accents

### Koncept
Två parallella palettsystem — `--pastel-*` (Light, mjuka ytor) och `--pastel-*-accent` (Dark, skarpa detaljer). I Light Mode används båda samtidigt: ljus för bakgrunder/kort, mörk för indikatorer/ikoner/tags. I Dark Mode blir Dark-paletten primär.

### 1. CSS-variabler (`src/index.css`)

Ersätt nuvarande `--pastel-*` tokens i `:root` (light) och `.dark`:

**`:root` (Light Mode)**
```css
/* Soft surfaces */
--pastel-coral: 110 18% 64%;     /* Fern #AABBAA */
--pastel-peach: 50 26% 80%;      /* Pistachio #D9D6C1 */
--pastel-amber: 194 26% 70%;     /* Lagune #9FBFC8 */
--pastel-yellow: 197 33% 95%;    /* Sky #EDF4F6 */
--pastel-mint: 22 100% 86%;      /* Peach #FFD0B6 */
--pastel-teal: 36 100% 86%;      /* Honey #FFE1B9 */
--pastel-sky: 354 60% 68%;       /* Peony #DE7E89 */
--pastel-lavender: 350 75% 91%;  /* Rose #F8D7DD */
--pastel-rose: 281 24% 70%;      /* Plum #B8A0C2 */
--pastel-gray: 33 22% 74%;       /* Taupe #C9BEB0 */
--pastel-stone: 40 18% 91%;      /* Stone #ECE9E2 */

/* Accent variants (Dark palette used for icons/tags/indicators) */
--pastel-coral-accent: 119 11% 51%;    /* Fern #768F77 */
--pastel-peach-accent: 51 31% 69%;     /* Pistachio #C3BE9D */
--pastel-amber-accent: 194 28% 53%;    /* Lagune #6599AA */
--pastel-yellow-accent: 197 31% 87%;   /* Sky #D5E2E7 */
--pastel-mint-accent: 21 97% 75%;      /* Peach #FDAB82 */
--pastel-teal-accent: 36 99% 76%;      /* Honey #FEC987 */
--pastel-sky-accent: 353 49% 56%;      /* Peony #C45A66 */
--pastel-lavender-accent: 350 75% 85%; /* Rose #F2BEC8 */
--pastel-rose-accent: 286 18% 57%;     /* Plum #9A7FA5 */
--pastel-gray-accent: 33 19% 58%;      /* Taupe #A89780 */
--pastel-stone-accent: 40 21% 84%;     /* Stone #DEDAD1 */
```

**`.dark` (Dark Mode)** — accenten är primär, sätt båda till Dark-värden så `bg-pastel-*` också blir tydligt på mörk bakgrund.

### 2. Tailwind-config (`tailwind.config.ts`)
Lägg till accent-variant under varje pastel-färg:
```ts
pastel: {
  coral: { DEFAULT: "hsl(var(--pastel-coral))", accent: "hsl(var(--pastel-coral-accent))" },
  // ...samma mönster för alla 11
}
```
Detta ger klasser som `bg-pastel-coral-accent`, `text-pastel-coral-accent`, `border-pastel-coral-accent`.

### 3. Helper-funktioner (`src/lib/colors.ts`)
Lägg till fyra nya helpers utan att ändra befintliga:
- `getAccentDotClass(color)` → `bg-pastel-{color}-accent` — för calendar-dots, indikatorer
- `getAccentTextClass(color)` → `text-pastel-{color}-accent` — för ikoner, titlar
- `getAccentBorderClass(color)` → `border-pastel-{color}-accent` — för tunna ramar
- `getAccentBgClass(color)` → `bg-pastel-{color}-accent` — för badges/tags/pills

Befintliga `getColorCardClass`, `getAvatarBgClass` etc behålls oförändrade — de fortsätter använda mjuka light-värden för ytor.

### 4. Punkter där Dark accent ska användas

| Plats | Fil | Byte |
|---|---|---|
| Kalender-dots (event/task/note) | `MonthView.tsx`, `WeekDayView.tsx` | `getColorDotClass` → `getAccentDotClass` |
| Notebook-ikon i header | `NotebookView.tsx` | ikon-färg → `getAccentTextClass` |
| Folder-ikon i header | `NotesView.tsx` (folder detail) | ikon-färg → `getAccentTextClass` |
| Folder/Notebook-grid ikoner | `FolderGridCard.tsx`, `NotebookCard.tsx` | dot/ikon → accent |
| Stripe-indikatorer | `MyListRow.tsx`, list cards | `getColorStripeClass` → `getAccentDotClass` |
| Tag/badge i tasks/notes | `TaskRow.tsx`, kategori-badges | accent bg + dark text |
| Selected tab/active nav | `TabNavigation.tsx` | aktiv färg → accent |
| Checkmark färgad | `AnimatedCheckbox.tsx` | accent |
| Smart List ikoner | `SmartListCard.tsx` | accent text |

Ytor som FÖRBLIR mjuka light:
- `getColorCardClass` (sticky notes, event-kort, task-kort bakgrund)
- `getAvatarBgClass`
- Stora kort-bakgrunder

### 5. Memory
Uppdatera `mem://design/pastel-color-palette-v2` med båda paletterna + regeln "Light = ytor, Dark accent = detaljer även i light mode". Lägg till Core-rad i `mem://index.md`.

### Filer
- `src/index.css` — 22 nya CSS-variabler (11 light + 11 accent), uppdatera `.dark`
- `tailwind.config.ts` — accent-variant per färg
- `src/lib/colors.ts` — 4 nya accent-helpers
- `src/components/calendar/MonthView.tsx`, `WeekDayView.tsx` — accent-dots
- `src/components/notes/NotebookView.tsx` — accent header icon
- `src/components/views/NotesView.tsx` — accent folder header icon
- `src/components/notes/FolderGridCard.tsx`, `NotebookCard.tsx` — accent icons
- `src/components/tasks/MyListRow.tsx`, `SmartListCard.tsx` — accent stripes/icons
- `src/components/tasks/AnimatedCheckbox.tsx` — accent check
- `src/components/navigation/TabNavigation.tsx` — accent active state
- `mem://design/pastel-color-palette-v2`, `mem://index.md`
