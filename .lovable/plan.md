

## Plan: Visa tidsintervall på alla kalendervyer

### Nuvarande problem
- **List-vy**: Visar tid korrekt (t.ex. "09:00 - 10:30") ✓
- **Tidslinje-vy**: Visar INGEN tid på korten - `renderItemCard` anropas med `undefined` för time/endTime

### Lösning
Uppdatera tidslinjevyn för att skicka med `time` och `endTime` till `renderItemCard`, samt visa tiden på korten även i compact/fillHeight-läge.

---

### Ändringar

**Fil**: `src/components/calendar/CalendarItemList.tsx`

#### 1. Uppdatera renderItemCard för att visa tid i timeline-läge

```tsx
// Task-kort (rad 298-302) - visa tid även när fillHeight
{(showTime || fillHeight) && time && (
  <span className="text-xs text-foreground/60">
    {time}{endTime && ` - ${endTime}`}
  </span>
)}

// Event-kort (rad 332-336) - samma ändring
{(showTime || fillHeight) && time && (
  <span className="text-xs text-foreground/60">
    {time}{endTime && ` - ${endTime}`}
  </span>
)}

// Note-kort - lägg till tidsvisning
{fillHeight && time && (
  <span className="text-xs text-foreground/60 block">
    {time}{endTime && ` - ${endTime}`}
  </span>
)}
```

#### 2. Skicka med time/endTime i timeline-renderingen

```tsx
// Rad 483 - ändra från:
{renderItemCard(item, type, undefined, undefined, true, true)}

// Till:
{renderItemCard(item, type, time, endTime, true, true)}
```

---

### Visuellt resultat

**Tidslinje-vy (efter):**
```text
09:00 ┃ ┌──────────────────────────┐
      ┃ │ ○ Meeting with client    │
      ┃ │   09:00 - 10:30          │  ← Tidsintervall visas nu!
      ┃ │                          │
10:30 ┃ └──────────────────────────┘

11:00 ┃ ┌──────────────────────────┐
      ┃ │ ○ Quick task             │
      ┃ │   11:00 - 11:30          │
11:30 ┃ └──────────────────────────┘
```

**List-vy (oförändrad - fungerar redan):**
```text
┌──────────────────────────────────┐
│ ○ Meeting with client            │
│   09:00 - 10:30                  │
└──────────────────────────────────┘
```

---

### Sammanfattning

| Rad | Ändring |
|-----|---------|
| 298-302 | Task-kort: visa tid även när `fillHeight` är true |
| 332-336 | Event-kort: visa tid även när `fillHeight` är true |
| 359 | Note-kort: lägg till tidsvisning för timeline |
| 483 | Skicka `time, endTime` istället för `undefined, undefined` |

