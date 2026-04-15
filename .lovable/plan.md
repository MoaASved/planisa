

## Fix FolderGridCard — symmetriska hörn och textplacering

### Problem
- Höger nedre hörn har en böjd linje (Q-kurva mot y=48) som skiljer sig från vänster nedre hörn
- Texten sitter för nära mappens underkant

### Ändringar i `src/components/notes/FolderGridCard.tsx`

**1. Fixa höger nedre hörn**
Nuvarande path har asymmetri — höger sida går `Q 200 150, 200 48` (kurva upp till y=48) medan vänster har `Q 0 150, 8 150` (liten rundning). Ändra pathen så att höger nedre hörn har samma rundning som vänster:

```
L 192 150          ← rakt ner till botten-höger
Q 200 150, 200 142 ← samma rundning som vänster
```

Uppdaterad path:
```
M 8 40
Q 0 40, 0 48
L 0 142
Q 0 150, 8 150
L 192 150
Q 200 150, 200 142
L 200 40
Q 200 32, 192 32
L 80 32
Q 74 32, 72 26
L 68 14
Q 66 8, 60 8
L 16 8
Q 8 8, 8 16
Z
```

**2. Flytta upp texten**
- Folder name: `y="128"` → `y="122"`
- Item count: `y="143"` → `y="136"`

### Fil som ändras
Bara `src/components/notes/FolderGridCard.tsx`.

