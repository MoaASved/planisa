
## Större Smart List-titlar + Title Case-sektioner

### Problem 1: Smart List-titlar för små
"Priority", "Today" och pinnade lists-namn är `text-[13px] font-medium` — mindre än My Lists-rubrikerna nedanför (`flow-card-title` = 15px medium). Hierarkin känns omvänd.

### Lösning 1
I `SmartListCard.tsx` ändra titel från `text-[13px] font-medium` → `text-[16px] font-semibold tracking-tight`. Då blir de tydligt större än My List-raderna (15px medium) men fortfarande lugnare än page title (22px).

### Problem 2: Sektionsrubriker inne i list-detalj är ALL CAPS
`flow-section-count`-klassen i `index.css` använder förmodligen `uppercase` på namnet, eller så sätts det någon annanstans. Behöver verifieras — men SectionHeader använder redan `flow-section-title` som enligt vår design ska vara Title Case (15px semibold).

Behöver kolla `flow-section-title`/`flow-section-count`-definitionen i `index.css`. Om `text-transform: uppercase` finns där → ta bort.

### Lösning 2
- Säkerställ att `.flow-section-title` INTE har `uppercase`.
- Öka storleken specifikt för sektionsrubriker inne i listor till `text-[16px] font-semibold tracking-tight` så de står ut tydligt utan att vara skrikiga.
- Behåll Title Case (visas som inputen är skriven).
- Counten bredvid: `text-[13px] font-normal text-muted-foreground/60`.

Eftersom `.flow-section-title` används på fler ställen (My Lists-rubrik m.fl.) gör vi detta på `SectionHeader`-komponenten direkt med inline-klasser istället för att ändra den globala klassen — så My Lists-rubriken förblir 15px.

### Filer
- `src/components/tasks/SmartListCard.tsx` — titel 16px semibold
- `src/components/tasks/SectionHeader.tsx` — använd lokala 16px semibold + säkerställ ingen uppercase
- `src/index.css` — verifiera och ev. ta bort `text-transform: uppercase` från `.flow-section-title` om den finns där
