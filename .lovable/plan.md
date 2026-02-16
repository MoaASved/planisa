

## Fix: Gor hela tid-containern klickbar pa bade mobil och desktop

### Problem

Tids-inputarna (`input[type="time"]`) saknar de WebKit-regler som datum-inputen redan har. Detta orsakar tva problem:

1. **Mobil (iOS/Android)**: Inputen kollapsar till noll bredd nar vardet ar tomt -- hela containern blir oklickbar
2. **Desktop**: Webblasarens inbyggda klockikon visas bredvid Lucide-ikonen, vilket ger "tva klockor"

Datum-inputen fungerar korrekt eftersom den redan har `[&::-webkit-calendar-picker-indicator]:opacity-0` och `[&::-webkit-calendar-picker-indicator]:absolute` (se rad 132 i CreateEventModal).

### Losning

Lagg till exakt samma tva CSS-regler pa alla fyra tids-inputs (start + slut i bade CreateEventModal och EditEventModal). Inga andra andringar behovs.

### Tekniska detaljer

**Fil 1: `src/components/modals/CreateEventModal.tsx`**

Rad 151 -- startTime input, lagg till picker-regler:
```
className="... flex-1 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
```

Rad 156 -- endTime input, samma andring.

**Fil 2: `src/components/modals/EditEventModal.tsx`**

Rad 144 -- startTime input, samma andring.
Rad 152 -- endTime input, samma andring.

**Fil 3: `src/components/tasks/TaskEditPanel.tsx`**

Rad 156 -- startTime input, samma andring.
Rad 163 -- endTime input, samma andring.

### Vad detta gor

- `opacity-0` doljer webblasarens native klockikon (loser "tva klockor" pa desktop)
- `absolute` gor att den osynliga native-pickern tacker hela inputen, sa hela containern blir klickbar (loser mobil-problemet)
- Containrarna behallar sin slimma storlek (`py-2.5`) utan nagon `min-height`

