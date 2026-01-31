

## Plan: Verkligt kompakt Undo-toast

### Problem
Sonner's toaster-wrapper (containern som håller alla toasts) har en default `width: 356px` och centrerar/positionerar sig över hela bredden. Även om vi stylar själva toasten med `w-auto`, så sitter den fortfarande i en bred container.

---

## Lösning

### `src/components/ui/sonner.tsx`

Lägg till en custom className på själva Toaster-komponenten som överskrider Sonner's default container-bredd. Vi använder `!important` via `!` prefix i Tailwind för att forcera stilarna.

```tsx
<Sonner
  theme="light"
  className="toaster group !right-4 !bottom-4"
  position="bottom-right"
  style={{
    '--width': 'auto',
  } as React.CSSProperties}
  toastOptions={{
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:text-xs group-[.toaster]:border-border/50 group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg group-[.toaster]:py-2 group-[.toaster]:px-3 group-[.toaster]:w-auto group-[.toaster]:min-w-0 group-[.toaster]:max-w-fit",
      description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[10px]",
      actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:rounded-md group-[.toast]:text-[10px] group-[.toast]:font-medium group-[.toast]:py-0.5 group-[.toast]:px-2",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:text-[10px]",
    },
  }}
/>
```

### `src/index.css`

Lägg till CSS som overridar Sonner's container-bredd globalt:

```css
/* Compact toast container */
[data-sonner-toaster] {
  --width: auto !important;
}

[data-sonner-toaster] [data-sonner-toast] {
  width: auto !important;
  min-width: 0 !important;
}
```

---

## Visuell skillnad

**Före (container = 356px bred):**
```text
┌────────────────────────────────────────┐
│ Task deleted                    [Undo] │
└────────────────────────────────────────┘
             (bred container)
```

**Efter (container = auto, bara så bred som innehållet):**
```text
                      ┌──────────────────┐
                      │ Task deleted [Undo]│
                      └──────────────────┘
                       (kompakt container)
```

---

## Sammanfattning

| Fil | Ändring |
|-----|---------|
| `src/components/ui/sonner.tsx` | Lägg till style prop för `--width: auto` + `max-w-fit` |
| `src/index.css` | CSS override för Sonner's container-bredd |

