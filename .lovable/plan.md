

## Plan: Dynamisk Theme-Color

### Sammanfattning
Ändrar theme-color från statisk blå till dynamisk färg som matchar appens bakgrund baserat på valt tema (ljust eller mörkt).

---

## Ändringar

### 1. Uppdatera `index.html`

Ändra default theme-color till ljus bakgrundsfärg:

```html
<!-- Rad 9: Ändra från blå till appens ljusa bakgrundsfärg -->
<meta name="theme-color" content="#f7f9fc" />
```

### 2. Uppdatera `src/pages/Index.tsx`

Lägg till dynamisk uppdatering av theme-color när tema ändras:

```tsx
// I befintlig useEffect för tema (efter rad 33)
useEffect(() => {
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
    // Uppdatera theme-color för mörkt tema
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', '#0d1117');
  } else {
    document.documentElement.classList.remove('dark');
    // Uppdatera theme-color för ljust tema
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', '#f7f9fc');
  }
}, [settings.theme]);
```

---

## Färger som används

| Tema | Bakgrundsfärg | Hex-kod |
|------|---------------|---------|
| Ljust | Mjuk ljusgrå ("Cloud Dancer") | `#f7f9fc` |
| Mörkt | Mörk grå-blå | `#0d1117` |

---

## Resultat

- **Ljust tema**: Statusbaren blir ljusgrå och smälter in med appen
- **Mörkt tema**: Statusbaren blir mörk och matchar appens bakgrund
- **Automatiskt**: Ändras direkt när användaren byter tema i inställningarna

---

## Filer som påverkas

| Fil | Åtgärd |
|-----|--------|
| `index.html` | Ändra default theme-color till ljus bakgrundsfärg |
| `src/pages/Index.tsx` | Lägg till dynamisk uppdatering av theme-color |

