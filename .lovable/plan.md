

## Fix: Event-tidsval fungerar inte + forbattrad touch-upplevelse

### Rotorsak

Koden ar korrekt -- `isAllDay` ar `false` och tidsfalten renderas. Problemet ar troligen att:

1. **`glass-modal` CSS** med `backdrop-filter: blur(20px)` kan blocka native time pickers pa vissa mobila webblasare (kand bugg i WebKit/Safari)
2. **Tidsinput-falten ar for sma** att traffa med fingret pa mobil (input type="time" i en liten container)
3. **Ingen min-height** pa time input-containern

### Losning

| Fil | Andring |
|-----|---------|
| `src/components/modals/CreateEventModal.tsx` | Lagg till `min-h-[44px]` pa tid-containers for battre touch-target, lagg till `-webkit-appearance: none` och explicita styles |
| `src/components/modals/EditEventModal.tsx` | Samma forbattringar |
| `src/index.css` | Lagg till CSS-regel for `input[type="time"]` som sakerstaller klickbarhet inuti backdrop-filter-containers |

### Tekniska detaljer

**1. CSS-fix for time inputs inuti glass-modal (index.css):**
```css
/* Ensure native time/date pickers work inside backdrop-filter containers */
.glass-modal input[type="time"],
.glass-modal input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  z-index: 1;
  min-height: 44px;
  cursor: pointer;
}
```

**2. Storre touch-target pa tid-containers (CreateEventModal + EditEventModal):**

Andra tid-containrarna fran `py-2.5` till `py-3` och lagg till `min-h-[44px]` for att uppfylla Apples rekommenderade 44px touch-target:

```tsx
<div className="flex-1 bg-secondary rounded-xl px-3 py-3 min-h-[44px] flex items-center gap-2">
  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
  <input
    type="time"
    value={startTime}
    onChange={(e) => handleStartTimeChange(e.target.value)}
    className="bg-transparent border-0 outline-none text-sm font-medium text-foreground flex-1 min-h-[36px] cursor-pointer"
  />
</div>
```

**3. Samma andringar i EditEventModal** for att halla dem konsistenta.

### Sammanfattning
- CSS-regeln sakerstaller att native time pickers fungerar inuti glasmorphism-containers
- Storre touch-targets gor det lattare att traffa med fingret
- `cursor: pointer` gor det tydligare att falten ar klickbara

