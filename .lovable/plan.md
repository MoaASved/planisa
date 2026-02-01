

## Plan: Scroll till toppen vid tab-byte

### Sammanfattning
Lägger till automatisk scroll-to-top när användaren byter mellan huvudsektioner (Home, Calendar, Tasks, Notes, Profile). Detta säkerställer att man alltid börjar högst upp när man navigerar till en ny sektion.

---

## Ändringar

### `src/pages/Index.tsx`

**1. Lägg till useEffect för scroll-to-top (efter rad 35):**

```tsx
// Scroll to top when changing tabs
useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [activeTab]);
```

---

## Teknisk förklaring

| Koncept | Beskrivning |
|---------|-------------|
| `useEffect` med `[activeTab]` | Körs varje gång `activeTab` ändras |
| `behavior: 'instant'` | Omedelbar scroll (ej animerad) för snabb navigation |
| `window.scrollTo` | Scrollar hela dokumentet till toppen |

---

## Varför `instant` istället för `smooth`?

- **Snabbare upplevelse** - Användaren vill se den nya sektionen direkt
- **Undviker förvirring** - Smooth scroll kan kännas konstigt när allt innehåll byts ut
- **Standard i appar** - De flesta mobila appar byter vy omedelbart

---

## Navigeringsflöden som täcks

| Navigeringssätt | Täcks |
|-----------------|-------|
| TabNavigation (nedre menyn) | ✅ |
| HomeView widgets (klick på Calendar, Tasks) | ✅ |
| Profile-knappen i TopBar | ✅ |
| QuickCreate (skapar task/note) | ✅ |

---

## Filer som påverkas

| Fil | Åtgärd |
|-----|--------|
| `src/pages/Index.tsx` | Lägg till useEffect för scroll-to-top |

