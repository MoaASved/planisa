

## Fix: Gruppera tasks i "kolumner" om 3

### Problem
Idag visas de 3 första vertikalt, och resten ligger som enskilda kort i en horisontell carousel. Användaren vill att hela listan grupperas i kolumner om 3 — varje svep visar nästa kolumn med 3 tasks staplade.

### Lösning
I `src/components/views/TasksView.tsx`, skriv om `TaskSection`-renderingen:

**1. Gruppera tasks i chunks om 3:**
```ts
const columns: Task[][] = [];
for (let i = 0; i < tasks.length; i += 3) {
  columns.push(tasks.slice(i, i + 3));
}
```

**2. Rendera alltid som horisontell snap-carousel** (även om bara 1 kolumn finns):
- Om `columns.length === 1`: rendera utan horisontell scroll (vanlig vertikal stapel, full bredd).
- Om `columns.length > 1`: snap-carousel där varje "slide" är en kolumn med 3 staplade `TaskRow`.

**3. Kolumn-bredd:**
- Varje kolumn `w-full shrink-0 snap-start` så hela viewport-bredden visar exakt en kolumn åt gången.
- Inuti kolumnen: `space-y-2` så de 3 tasks "sitter ihop" vertikalt.

**4. Ta bort `compact`-varianten** för overflow — alla tasks visas nu i samma fulla `TaskRow`-design oavsett kolumn.

**5. Lägg till diskreta sid-indikatorer** (små prickar under sektionen) när `columns.length > 1`, så användaren ser hur många kolumner som finns.

### Resultat
- ≤3 tasks → vertikal stapel som idag.
- 4–6 tasks → 2 kolumner, svep en gång åt sidan för att se kolumn 2.
- 7–9 tasks → 3 kolumner, osv.
- Alla tasks har samma utseende (ingen compact-variant).
- Prickar visar antal kolumner.

### Filer
- `src/components/views/TasksView.tsx` — skriv om `TaskSection`-render.

