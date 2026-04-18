
## Minska page titles till 25/semibold

Uppdatera `.flow-page-title` i `src/index.css` från `text-[28px]` → `text-[25px]`. Vikt och tracking behålls (semibold, tracking-tight, letter-spacing -0.02em).

Eftersom alla page headers (Tasks, Notes, Calendar, Home, Notebook) redan använder `flow-page-title`-klassen räcker det att ändra på ett ställe.

Uppdaterar även `mem://design/typography-system` och `mem://index.md` Core-regeln så skalan stämmer (28 → 25).

### Fil
- `src/index.css`
- `mem://design/typography-system`
- `mem://index.md`
