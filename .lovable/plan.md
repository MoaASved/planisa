

## Fix: Tid-containrar oklickbara pa mobil

### Rotorsak

Pa iOS kollapsar en tom `input[type="time"]` till noll bredd nar picker-indikatorn ar dolj med `opacity-0` och `absolute`. Det finns inget synligt innehall som ger inputen bredd, sa den blir 0px bred och darmed oklickbar -- aven med `flex-1`.

### Losning

Gora hela wrapper-diven klickbar genom att lagga till en `onClick`-handler som programmatiskt triggar inputens `showPicker()` (med fallback till `focus()`). Dessutom lagga till `w-full` pa inputen for att garantera att den tar plats i containern.

### Tekniska detaljer

**Fil 1: `src/components/modals/CreateEventModal.tsx`**

For bade start- och sluttid:
- Lagg till `ref` pa varje input (t.ex. `startTimeRef`, `endTimeRef`)
- Lagg till `onClick` pa wrapper-diven som anropar `ref.current?.showPicker?.()` med fallback till `ref.current?.focus()`
- Lagg till `w-full` pa inputen for att garantera bredd

```tsx
// Exempel for start-tid:
const startTimeRef = useRef<HTMLInputElement>(null);
const endTimeRef = useRef<HTMLInputElement>(null);

// Wrapper-div:
<div 
  className="flex-1 bg-secondary rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer"
  onClick={() => {
    try { startTimeRef.current?.showPicker(); } 
    catch { startTimeRef.current?.focus(); }
  }}
>
  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
  <input 
    ref={startTimeRef}
    type="time" 
    value={startTime} 
    onChange={(e) => handleStartTimeChange(e.target.value)} 
    className="bg-transparent border-0 outline-none text-sm font-medium text-foreground w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute" 
  />
</div>
```

Samma monster for endTime-inputen.

**Fil 2: `src/components/modals/EditEventModal.tsx`**

Exakt samma andring for bade start- och sluttids-inputs.

**Fil 3: `src/components/tasks/TaskEditPanel.tsx`**

Samma monster -- lagg till refs och onClick pa wrapper-divs.

### Sammanfattning

- 3 filer andras
- Varje tids-input far en `ref` och dess wrapper-div far en `onClick`-handler
- `showPicker()` oppnar native tidsvaljaren direkt vid klick pa containern
- `w-full` pa inputen forhindrar noll-bredd-kollapsen
- Containrarna forblir slimma (`py-2.5`)
