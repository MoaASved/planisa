
Målet är tydligt: fixa “New Notebook”-modalen så den alltid är exakt centrerad.  
Efter genomgång av aktuell kod och preview-beteende är grundorsaken identifierad.

## Diagnos (varför den hamnar fel)
I `src/components/views/NotesView.tsx` ligger positionering (`top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`) och animation (`animate-scale-in`) på samma element.

`animate-scale-in` använder en keyframe som sätter `transform: scale(...)`.  
När animationen körs skriver den över `translate(-50%, -50%)`, vilket gör att elementets övre vänstra hörn hamnar i mitten istället för att hela modalen centreras. Resultatet blir att modalen ser förskjuten ut åt höger (och delvis utanför viewport).

## Implementationsplan (minimal och säker)
### Fil att ändra
- `src/components/views/NotesView.tsx` (blocket för `showNotebookModal`)

### Steg 1: Dela upp positionering och animation i två lager
- Behåll ett **yttre fixed-position-element** som endast ansvarar för centrering:
  - `position: fixed`
  - `top: 50%`
  - `left: 50%`
  - `transform: translate(-50%, -50%)`
  - `width: calc(100% - 48px)`
  - `max-width: 400px`
  - hög z-index
- Flytta visuell styling + animation till ett **inre wrapper-element**:
  - `bg-card`
  - `rounded-[20px]`
  - `shadow-xl`
  - `p-6`
  - `animate-scale-in`

Detta gör att animationen inte längre kan skriva över centrerings-transformen.

### Steg 2: Säkerställ overlay enligt dina krav
- Backdrop ska vara separat element med:
  - `position: fixed`
  - `inset: 0`
  - hög z-index (under modalen, över resten av UI)
- Behåll blur/backdrop-styling.
- Klick på backdrop fortsätter stänga modalen som idag.

### Steg 3: Bevara allt annat oförändrat
- Ingen ändring av notebook-logik (create/edit/save/close).
- Ingen ändring av färgval, knappar eller formulärinnehåll.
- Endast layout/positioneringstrukturen för modalen justeras.

## Tekniska detaljer
```text
Nuvarande (fel):
[Fixed modal element]
  - translate(-50%, -50%)
  - animate-scale-in (sätter transform: scale)  <-- konflikt

Målläget (korrekt):
[Fixed positioning shell]
  - translate(-50%, -50%)   <-- permanent, aldrig överstyrd
  [Animated inner panel]
    - animate-scale-in (scale)
    - visual styling (bg, radius, padding)
```

## Validering efter implementation
1. Öppna Notes → Notebooks → New Notebook.
2. Verifiera att modalen är exakt centrerad horisontellt och vertikalt.
3. Verifiera på mobil viewport att hela modalen syns (ingen avkapning åt höger).
4. Verifiera att backdrop täcker hela skärmen och ligger över navbaren.
5. Verifiera att klick utanför modalen stänger den som tidigare.
6. Kontrollera att ingen horisontell overflow uppstår vid öppnad modal.
