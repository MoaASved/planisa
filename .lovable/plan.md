
# Ta bort pilen under toolbaren nar den ar ihopfalld

## Problem
Toggle-knappen (pilen) under toolbaren visas alltid - bade nar toolbaren ar expanderad och nar den ar ihopfalld. Den ska bara synas nar toolbaren ar expanderad.

## Andring

**Fil: `src/components/notes/NoteEditor.tsx` (rad 450-458)**

Wrappa "Toolbar toggle tab"-sektionen i ett villkor sa den bara renderas nar `!toolbarCollapsed`:

```text
Fore:
  {/* Toolbar toggle tab */}
  <div className="flex justify-center pt-1">
    <button ...>
      {toolbarCollapsed ? <ChevronDown /> : <ChevronUp />}
    </button>
  </div>

Efter:
  {/* Toolbar toggle tab - only when expanded */}
  {!toolbarCollapsed && (
    <div className="flex justify-center pt-1">
      <button onClick={() => setToolbarCollapsed(true)} ...>
        <ChevronUp />
      </button>
    </div>
  )}
```

Nar toolbaren ar ihopfalld finns det redan en ChevronUp-knapp inne i sjalva toolbaren (rad 440-444) som kan anvandas for att falla ihop den, och nar den ar ihopfalld behover anvandaren trycka nagon annanstans for att oppna den igen - eller sa kan vi lata spacern/toolbaromradet vara klickbart. 

Notera: Eftersom pilen forsvinner helt nar toolbaren ar ihopfalld, behovs ett satt att oppna den igen. Det finns redan en collapse-knapp i toolbaren (rad 440-444) som stanger den. For att oppna igen kan vi gora spacer-diven klickbar nar toolbaren ar ihopfalld.

Alternativt: Visa en liten diskret "oppna"-knapp bara nar collapsed, men det andrar beteendet. Enklast ar att bara ta bort pilen under nar expanded och behalla den lilla toggle-logiken via spacern.
