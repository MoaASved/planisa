

## Problem
Highlight-knappen öppnar ingen färgväljare — UI:t saknas. Användaren vill också ha ett "överstrykningspennaläge" där man väljer färg först och sedan drar/markerar text.

## Goda nyheter
Överstrykningspennaläget **går att implementera** med TipTap. Genom att lyssna på `onSelectionUpdate` kan vi automatiskt applicera highlight-färgen så fort användaren markerar text medan "highlight mode" är aktivt. Det fungerar som en digital överstrykningspenna: välj färg → dra över text → färgen appliceras direkt.

## Lösning

### Koncept: Highlight Mode
1. Användaren klickar highlight-knappen → färgväljare visas
2. Användaren väljer en färg → "highlight mode" aktiveras (knappen lyser, ikon ändras)
3. Användaren markerar text genom att dra → highlight appliceras automatiskt vid varje markering
4. Mode förblir aktivt tills användaren klickar highlight-knappen igen (toggle off)

### Fil 1: `src/components/notes/NoteEditor.tsx`

1. **Lägg till state**: `activeHighlightColor` (null = inaktivt, PastelColor = aktivt läge)

2. **Lägg till highlight-picker UI** under toolbaren när `showHighlightPicker` är true — rad med färgprickar (pastelColors) + "Remove highlight"-knapp

3. **Highlight mode via `onSelectionUpdate`**: Lägg till en `useEffect` som lyssnar på editorns `selectionUpdate`-event. Om `activeHighlightColor` är satt och det finns en icke-tom selektion → applicera `setHighlight({ color })` automatiskt

4. **Visuell indikator**: När highlight mode är aktivt, visa en liten banner/badge på highlight-knappen som visar aktiv färg

5. **Vid färgval i pickern**:
   - Om text är markerad → applicera direkt (befintligt beteende)
   - Om ingen text är markerad → aktivera highlight mode med den färgen
   - Stäng pickern

6. **Toggle av**: Klick på highlight-knappen igen → stäng av highlight mode (`activeHighlightColor = null`)

### Fil 2: `src/components/notes/NotebookPageEditor.tsx`

Identiska ändringar som NoteEditor.

### Design av färgväljaren
- Liten panel som visas under toolbaren: `absolute top-full`, `bg-background rounded-2xl shadow-lg p-3 z-[1300]`
- Färgprickar: `w-8 h-8 rounded-full` med respektive `bg-pastel-{color}`
- Sista raden: "Remove highlight"-knapp som kör `unsetHighlight()`
- Backdrop-klick stänger panelen

### Inga andra filer ändras

