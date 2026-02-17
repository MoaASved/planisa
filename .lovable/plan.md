
# Fix: Vitt kort täcker hela skärmen (inklusive pb-24)

## Rotorsaken

I `src/pages/Index.tsx` linje 130 har `<main>` klassen `pb-24` (96px padding längst ner). Det vita kortet i `CalendarItemList` fyller sin container men container slutar vid content-kanten — de sista 96px är beige padding som syns under det vita kortet.

Dessutom är `<div className="min-h-screen bg-background">` i `Index.tsx` beige, vilket syns i alla gap.

## Lösningen

Det enklaste och pålitligaste sättet: ändra det vita kortets `minHeight` i `CalendarItemList` till att täcka hela viewport:

```
minHeight: 'calc(100vh - 200px)'
```

Men ett ännu bättre tillvägagångssätt — ändra bakgrundsfärgen på `<body>` / root-elementet för kalendersidan till vitt, eller ge det vita kortet en `paddingBottom` som kompenserar för `pb-24`.

Den rätta tekniska lösningen är:

**`src/components/calendar/CalendarItemList.tsx`** — ge det vita kortet explicit `minHeight` beräknad på viewport minus toppavståndet:

```tsx
style={{
  background: '#ffffff',
  borderRadius: '20px 20px 0 0',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
  minHeight: 'calc(100vh - 200px)',  // täcker alltid till botten
}}
```

Och ta bort `overflow-hidden` från `CalendarView.tsx` rad 153 (`<div className="flex-1 overflow-hidden">`) — annars klipps det vita kortet även om det är tillräckligt stort.

## Alla ändringar

**1. `src/components/calendar/CalendarItemList.tsx`**

Ändra `minHeight: '100%'` till `minHeight: 'calc(100vh - 200px)'` på det vita kortet. Det säkerställer att kortet alltid når långt under synfältet.

**2. `src/components/views/CalendarView.tsx`**

Ändra:
```tsx
<div className="flex-1 overflow-hidden">
```
Till:
```tsx
<div className="flex-1">
```

`overflow-hidden` klipper innehållet och hindrar det vita kortet från att växa ut till botten.

**3. `src/components/calendar/MonthView.tsx`**

Ta bort `overflow-hidden` från lower section wrappern:
```tsx
<div className="flex-1 flex flex-col relative bg-background">
```

**4. `src/components/calendar/WeekDayView.tsx`**

Ta bort `overflow-hidden` från lower section wrappern:
```tsx
<div className="flex-1 flex flex-col relative bg-background">
```

## Teknisk förklaring

Problemet är att `overflow-hidden` i olika lager klippt det vita kortets verkliga storlek. Och `min-h: 100%` fungerar inte när föräldrar inte har explicit höjd definierad — `%` räknar från närmaste förälder med definierad höjd. Med `calc(100vh - 200px)` bypassa hela kedjan och säkerställer att det vita kortet alltid räcker ner oavsett layouthierarki.

## Sammanfattning

- `src/components/calendar/CalendarItemList.tsx` — ändra `minHeight` till viewport-baserad beräkning
- `src/components/views/CalendarView.tsx` — ta bort `overflow-hidden` från flex-1 wrapper
- `src/components/calendar/MonthView.tsx` — ta bort `overflow-hidden` från lower section
- `src/components/calendar/WeekDayView.tsx` — ta bort `overflow-hidden` från lower section
