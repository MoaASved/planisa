

## Plan: Kompaktare Undo-toast

### Sammanfattning
Gör undo-toasten ännu mer diskret genom att flytta den till ett hörn och minska storleken så den inte tar upp en hel rad.

---

## Ändringar

### `src/components/ui/sonner.tsx`

**Position:**
Ändra från `bottom-center` till `bottom-right` för att toasten ska dyka upp diskret i ett hörn istället för mitt på skärmen.

**Styling-uppdateringar:**
- Mindre padding: `py-2 px-3` istället för `py-2.5 px-3`
- Mindre text: `text-xs` istället för `text-sm`
- Auto width så den bara tar den plats som behövs: `w-auto`
- Mindre action-knapp med tightare padding

```tsx
<Sonner
  theme="light"
  className="toaster group"
  position="bottom-right"
  toastOptions={{
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-sm group-[.toaster]:text-foreground group-[.toaster]:text-xs group-[.toaster]:border-border/50 group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg group-[.toaster]:py-2 group-[.toaster]:px-3 group-[.toaster]:w-auto group-[.toaster]:min-w-0",
      description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[10px]",
      actionButton: "group-[.toast]:bg-foreground group-[.toast]:text-background group-[.toast]:rounded-md group-[.toast]:text-[10px] group-[.toast]:font-medium group-[.toast]:py-0.5 group-[.toast]:px-2",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:text-[10px]",
    },
  }}
/>
```

---

## Visuell skillnad

**Före (centrerad, bred):**
```text
            ┌────────────────────────────────┐
            │ Task deleted        [Undo]     │
            └────────────────────────────────┘
```

**Efter (höger hörn, kompakt):**
```text
                              ┌─────────────────┐
                              │ Task deleted [Undo] │
                              └─────────────────┘
```

---

## Sammanfattning

| Ändring | Före | Efter |
|---------|------|-------|
| Position | `bottom-center` | `bottom-right` |
| Text-storlek | `text-sm` | `text-xs` |
| Padding | `py-2.5` | `py-2` |
| Border-radius | `rounded-xl` | `rounded-lg` |
| Action-knapp text | `text-xs` | `text-[10px]` |
| Bredd | Full width | Auto (minimalt) |

