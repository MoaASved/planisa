

# Floating Toolbar i NoteEditor + Aterstall NotebookPageEditor

## Oversikt

Tva andringar:
1. Aterstall NotebookPageEditor.tsx till originalversionen (innan floating toolbar-andringarna)
2. Gor toolbaren i NoteEditor.tsx till en fixed/floating komponent

## Andring 1: Aterstall NotebookPageEditor.tsx

Aterstall filen till den version som visas i `<current-code>` - den ursprungliga versionen innan nagra toolbar-andringar gjordes. Den har redan korrekt struktur med toolbar som del av sidan.

## Andring 2: NoteEditor.tsx - Floating Toolbar

### Nuvarande problem
Toolbaren (raderna 294-459) ar en `flex-shrink-0` div som sitter i normalt dokumentflode. Nedanfor den finns header (back-pil, rad 461-469) och datum/folder (rad 471-485), ocksa `flex-shrink-0`. Sedan kommer scrollbart innehall (rad 488-500).

### Ny struktur

```text
+--------------------------------------------------+
| [Fixed inset-0 container]                        |
|                                                  |
|  [FIXED TOOLBAR - position: fixed]               |
|   top: 12px, centered, z-[1250]                 |
|   White rounded container with shadow            |
|   + collapse/expand toggle below it              |
|                                                  |
|  [SCROLLABLE AREA - flex-1 overflow-auto]         |
|   - Spacer div (for toolbar overlap)             |
|   - Back arrow (scrolls away)                    |
|   - Date centered (scrolls away)                 |
|   - Folder label (scrolls away)                  |
|   - Title input                                  |
|   - Editor content                               |
|                                                  |
|  [Metadata popup, FolderPicker, VoiceRecorder]    |
+--------------------------------------------------+
```

### Tekniska detaljer

**Toolbar** (nuvarande rad 294-459):
- Flytta ut ur normalt flode
- Wrappa i `<div className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-[1250]">`
- Behall all toolbar-funktionalitet (collapsed/expanded, dropdown-menyer, knappar)
- Uppdatera shadow till `shadow-[0_2px_12px_rgba(0,0,0,0.12)]`
- Collapse-knappen placeras under toolbaren i samma fixed container

**Header och datum** (nuvarande rad 461-485):
- Ta bort `flex-shrink-0` fran bade header-div och datum-div
- Flytta in i scrollable area (nuvarande rad 488)
- De scrollar normalt med innehallet

**Scrollable area**:
- Lagg till en spacer-div langst upp (`h-16` nar toolbar ar expanded, `h-10` nar collapsed) for att forhindra overlap
- Back-pil, datum, folder, titel och editor finns har

**Inga andra andringar** - all funktionalitet (metadata popup, folder picker, voice recorder, highlight picker, save/delete) forblir oforandrad.
