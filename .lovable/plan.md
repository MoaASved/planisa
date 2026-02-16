

## Fix: Ta bort `min-height: 44px` fran globala CSS-regeln

### Rotorsak

Den globala CSS-regeln i `src/index.css` (rad 5-12) satter `min-height: 44px` pa alla `input[type="time"]` och `input[type="date"]`. Detta overskrider den smalare paddingen (`py-2.5`) i komponenterna och gor att containrarna alltid blir minst 44px hoga.

### Losning

**Fil:** `src/index.css` (rad 5-12)

Ta bort `min-height: 44px` fran regeln. Behaall `position: relative`, `z-index: 1` och `cursor: pointer`.

Fran:
```css
input[type="time"],
input[type="date"] {
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
  cursor: pointer;
}
```

### Sammanfattning

En enda radering av `min-height: 44px` gor att tid-containrarna atergar till sin naturliga, nattare storlek baserad pa komponenternas padding.

