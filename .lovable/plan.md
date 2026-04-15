

## Finjustera mappformen — realistisk mapp med papper

### Problem
Nuvarande mappkort är för höga (stående) med en liten centrerad flik som inte ser ut som en riktig mapp.

### Lösning
Skriv om SVG-formen i `FolderGridCard.tsx` för en realistisk mappillusion:

**Ny form och proportioner:**
- Ändra SVG viewBox till liggande format (~200×150) istället för nuvarande 200×260
- Mappen blir bredare och lägre — mer som ett liggande A4-kuvert/mapp
- Ungefär samma storlek som sticky notes i gridet

**Realistisk flik:**
- Fliken placeras i **övre vänstra** hörnet (inte centrerad)
- Rundade hörn, naturlig trapezform

**Papper som sticker upp:**
- 2–3 vita/ljusa rektanglar sticker upp ovanför mappens överkant, lite sneda/förskjutna
- Skapar illusionen att det ligger dokument i mappen
- Papperskanterna har en minimal skugga

**Resterande design behålls:**
- Färgad bakgrund från `folder.color`
- Mörkare gradient i botten
- Mappnamn + "X items" nere till vänster (vit text)
- Tre-punktsmeny (⋯) nere till höger
- `active:scale-95`, `drop-shadow`

### Ungefärlig form
```text
     ┌────┐
     │tab │   ╱─────╲  ← papper som sticker upp
┌────┘    └──╱───────╲──┐
│                       │
│  Folder name      ⋯  │
└───────────────────────┘
```

### Fil som ändras
`src/components/notes/FolderGridCard.tsx` — hela SVG-strukturen skrivs om.

### Teknisk approach
- SVG viewBox: `0 0 200 150`
- Papper: 2–3 `<rect>` med `fill="white"` och `opacity="0.7"`, placerade ovanför mappkroppen, lätt roterade (`transform="rotate(-2)"` etc.)
- Mappform: `<path>` med flik i övre vänster, rundade hörn via Q-kurvor
- Gradient overlay i botten för textläsbarhet

