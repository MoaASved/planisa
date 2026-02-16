

## Fix: Ta bort `appearance: none` som blockerar tidsvaeljarens native picker

### Rotorsak

Den CSS-regel som lades till i foersta fixfoersoeket (`appearance: none` och `-webkit-appearance: none` paa `input[type="time"]`) tar bort webblaesarens inbyggda tidsvael-granssnitt (spinner, dropdown). Det aer detta som goer att man inte kan valja tid -- inputen faar fokus men det finns ingen native picker att interagera med.

### Loesning

**Fil:** `src/index.css` (rad 5-14)

Ta bort `appearance: none` och `-webkit-appearance: none` fraan regeln. Behaall `position: relative`, `z-index: 1` och `min-height: 44px` som fortfarande behoevs foer att loesa z-index-problem med backdrop-filter.

AEndra fraan:
```css
input[type="time"],
input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  z-index: 1;
  min-height: 44px;
  cursor: pointer;
}
```

Till:
```css
input[type="time"],
input[type="date"] {
  position: relative;
  z-index: 1;
  min-height: 44px;
  cursor: pointer;
}
```

### Sammanfattning

En enda radering av tvaa rader CSS (`appearance: none`) loser hela problemet. Native time pickers aaterstaells och anvandaren kan valja tid igen.
