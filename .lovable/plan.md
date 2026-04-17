

## Mjukare skugga på Folder-kort

### Problem
`FolderGridCard` har idag `filter: drop-shadow(0 4px 14px rgba(0,0,0,0.18))` runt hela SVG:n, vilket ger en hård/kantig skugga som följer mappens exakta form (inkl. tab-fliken upptill). Det syns särskilt som en skarp linje ovanför.

Dessutom finns en mörk gradient (`grad-${id}`) inuti SVG:n från `y=80` ner till botten med `rgba(0,0,0,0.35)` — det är denna som skapar den "skarpa skuggan" inuti mappen längst ner.

### Lösning
I `src/components/notes/FolderGridCard.tsx`:

**1. Mjukare yttre skugga**
Byt drop-shadow till en mer diffus, modern skugga med två lager:
```
filter: drop-shadow(0 2px 4px rgba(0,0,0,0.06)) drop-shadow(0 8px 24px rgba(0,0,0,0.10))
```
- Översta lagret: liten, tight skugga för djupkänsla.
- Nedre lagret: stor, mjuk, spridd skugga för "lift". 
- Lägre opacity (0.06 + 0.10 istället för 0.18) → mer seamless.

**2. Mjukare inre gradient (botten av mappen)**
Sänk `rgba(0,0,0,0.35)` → `rgba(0,0,0,0.18)` och flytta gradient-start från `y=80` → `y=60` så övergången blir längre och mjukare istället för en skarp linje.

### Resultat
- Ingen skarp kantig skugga ovanför fliken.
- Mjuk, diffus skugga runt hela mappen som "lyfter" den från bakgrunden.
- Botten-gradienten inuti mappen smälter mjukt istället för att skapa en hård mörk kant.

### Fil
- `src/components/notes/FolderGridCard.tsx` (rader 22 + 41–44 + 60–64)

