
# Visa pilen endast nar toolbaren ar ihopfalld

## Problem
Logiken ar omvand - pilen visas nar toolbaren ar *expanderad* (`!toolbarCollapsed`), men den ska visas nar toolbaren ar *ihopfalld* (`toolbarCollapsed`).

## Andring

**Fil: `src/components/notes/NoteEditor.tsx` (rad 450-460)**

Andra villkoret fran `!toolbarCollapsed` till `toolbarCollapsed`, byt ikon till `ChevronDown` (peka nedat for att indikera "oppna"), och andra onClick till `setToolbarCollapsed(false)`:

```text
Fore:
  {!toolbarCollapsed && (
    <div className="flex justify-center pt-1">
      <button onClick={() => setToolbarCollapsed(true)} ...>
        <ChevronUp />
      </button>
    </div>
  )}

Efter:
  {toolbarCollapsed && (
    <div className="flex justify-center pt-1">
      <button onClick={() => setToolbarCollapsed(false)} ...>
        <ChevronDown />
      </button>
    </div>
  )}
```

Spacer-diven (rad 466-469) kan aterga till enkel div utan klick-logik eftersom pilen nu hanterar att oppna toolbaren nar den ar ihopfalld.
