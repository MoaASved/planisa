
## Förminska page titles ytterligare

### Observation
25px känns fortfarande för klumpigt på platser som "Tasks"-rubriken, notebook-namn (NotebookView) och folder-namn (NotesView när man är inne i en folder).

### Lösning
Minska `.flow-page-title` i `src/index.css` från `text-[25px]` → `text-[22px]`. Behåll `font-semibold`, `tracking-tight`, `letter-spacing: -0.02em`.

22px ger en mer återhållsam, Apple-lik känsla (jämför iOS large titles som komprimeras till ~22-24px) — fortfarande tydligt hierarkiskt över sektionsrubriker (15px) men inte längre dominant.

Eftersom alla page headers använder klassen räcker det att ändra på ett ställe. Detta täcker:
- Tasks-rubriken
- Notes-rubriken & folder-namn
- Notebook-namn (NotebookView)
- Calendar månad/år
- Home greeting

### Memory
Uppdatera `mem://design/typography-system` och Core-regeln i `mem://index.md` (25 → 22).

### Fil
- `src/index.css`
- `mem://design/typography-system`
- `mem://index.md`
