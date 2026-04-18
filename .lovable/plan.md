
## Replace light-mode pastel palette with 11 new colors

### New palette (Light Mode only)
| Slot (token name kept) | New name | Hex | HSL |
|---|---|---|---|
| `--pastel-coral` | Fern | #D8E8C0 | 84 44% 83% |
| `--pastel-peach` | Pistachio | #C8DEC4 | 113 28% 82% |
| `--pastel-amber` | Lagune | #C4DCEA | 203 47% 84% |
| `--pastel-yellow` | Sky | #D2E6F4 | 206 62% 89% |
| `--pastel-mint` | Peach | #F2D8C8 | 22 65% 87% |
| `--pastel-teal` | Honey | #EEE0BE | 44 64% 84% |
| `--pastel-sky` | Peony | #E0C8D4 | 327 32% 83% |
| `--pastel-lavender` | Rose | #F0D4D8 | 351 53% 88% |
| `--pastel-rose` | Plum | #D8CCE0 | 273 25% 84% |
| `--pastel-gray` | Taupe | #D8D0C4 | 36 24% 81% |
| `--pastel-stone` | Stone | #D8D8D0 | 60 12% 83% |

Token slots are preserved (`coral, peach, amber, yellow, mint, teal, sky, lavender, rose, gray, stone`) so all existing `bg-pastel-*` classes keep working — only the underlying HSL values change. The `pastelColors` array in `src/lib/colors.ts` already has these labels in the correct order.

### Changes

**1. `src/index.css`** — update only the `:root` (Light Mode) `--pastel-*` HSL values to the 11 new colors above. Dark mode `.dark` block stays untouched. Accent variants (`--pastel-*-accent`) stay untouched (used for icons/dots elsewhere — but see #3 for task dots).

**2. Global text-on-pastel rule** — add a single token `--on-pastel: 40 6% 17%;` (#2C2C2A) and ensure components rendering text/icons over pastel surfaces use `text-[#2C2C2A]` (or `text-[hsl(var(--on-pastel))]`). Audit + fix:
- `StickyNoteCard.tsx` — preview text, date, pin icon → `#2C2C2A`
- `NotebookCard.tsx` — title + page count currently white; switch to `#2C2C2A`
- `FolderGridCard.tsx` — folder label
- Calendar event cards (`CalendarItemList.tsx`, `WeekDayView.tsx`, `MonthView.tsx`) — title/time text on colored bg
- `CreateEventModal.tsx` / `EditEventModal.tsx` color preview text

**3. Task list dots** — per spec, the colored dot is **fill only, no text**. Currently `MyListRow.tsx` and `ListDetailView.tsx` use `bg-pastel-${color}-accent` (dark accent). Switch the dot fills to the new light pastel: `bg-pastel-${color}` so they match the unified palette. Accent variants stay available for other usages but task list dots now use the light fill.

**4. Color picker UI** — `src/lib/colors.ts` `pastelColors` array order is already: Fern, Pistachio, Lagune, Sky, Peach, Honey, Peony, Rose, Plum (currently labeled "Soft Plum"), Taupe (currently "Warm Taupe"), Stone. Update labels to exactly: `Fern, Pistachio, Lagune, Sky, Peach, Honey, Peony, Rose, Plum, Taupe, Stone`. No reordering needed. Pickers (`ColorPickerSheet.tsx`, `CreateListModal.tsx`, `CategoryEditDrawer.tsx`, `FolderEditModal.tsx`, `NotebookEditModal.tsx`) consume this array — they auto-update.

**5. Notebook cover gradient overlay** — `NotebookCard.tsx` currently overlays a dark gradient + white text. Remove the dark gradient overlay and switch text to `#2C2C2A` so notebook covers show the pure new color with dark text per the global rule.

**6. Untouched**
- App background `#F5F3F0` (`--background`)
- Navbar `#1C1C1E` (nav pill)
- Dark mode (`.dark` block + all `--pastel-*-accent` tokens)
- Structural tokens (border, card, muted, primary, etc.)

### Files
- `src/index.css` — 11 HSL value updates in `:root`, add `--on-pastel`
- `src/lib/colors.ts` — relabel 11 entries
- `src/components/notes/StickyNoteCard.tsx` — text color → #2C2C2A
- `src/components/notes/NotebookCard.tsx` — remove dark overlay, text → #2C2C2A
- `src/components/notes/FolderGridCard.tsx` — label color → #2C2C2A
- `src/components/calendar/CalendarItemList.tsx` — event text → #2C2C2A
- `src/components/calendar/WeekDayView.tsx` — event text → #2C2C2A
- `src/components/calendar/MonthView.tsx` — event text → #2C2C2A (if applicable)
- `src/components/modals/CreateEventModal.tsx`, `EditEventModal.tsx` — preview text
- `src/components/tasks/MyListRow.tsx` — dot uses `bg-pastel-${color}` (light fill)
- `src/components/tasks/ListDetailView.tsx` — dot uses `bg-pastel-${color}` (light fill)
- `mem://design/pastel-color-palette-v2`, `mem://index.md` — update names + new hex values
