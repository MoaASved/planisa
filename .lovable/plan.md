

## Plan: Varmare, beige-neutral bakgrundsfarg

### Sammanfattning
Byta hela ljusa temats graton fran kall bla-gra (hue 210-220) till varm beige-neutral (hue ~30-40). Detta paverkar background, secondary, muted, border, input, shadows och meta theme-color.

---

## Andringar

### Fil 1: `src/index.css` (ljust tema, rad 8-56)

Byta alla kalla bla-gra nyanser till varma, neutrala toner:

| Variabel | Nuvarande (kall bla) | Ny (varm beige-neutral) |
|----------|----------------------|-------------------------|
| `--background` | `210 20% 98%` | `30 20% 98%` |
| `--secondary` | `210 20% 94%` | `30 15% 94%` |
| `--muted` | `210 15% 91%` | `30 10% 91%` |
| `--border` | `210 15% 90%` | `30 10% 90%` |
| `--input` | `210 15% 90%` | `30 10% 90%` |
| `--sidebar-accent` | `210 20% 96%` | `30 15% 96%` |
| `--sidebar-border` | `220 13% 91%` | `30 10% 91%` |

Shadows andras ocksa fran `hsl(220 20% 10% / ...)` till `hsl(30 10% 10% / ...)` for att matcha den varma tonen.

Foreground-farger (text) behaller sin morkhet men far en varmare hue:

| Variabel | Nuvarande | Ny |
|----------|-----------|-----|
| `--foreground` | `220 20% 10%` | `30 10% 10%` |
| `--card-foreground` | `220 20% 10%` | `30 10% 10%` |
| `--popover-foreground` | `220 20% 10%` | `30 10% 10%` |
| `--primary` | `220 15% 15%` | `30 8% 15%` |
| `--secondary-foreground` | `220 20% 20%` | `30 10% 20%` |
| `--muted-foreground` | `220 10% 45%` | `30 8% 45%` |
| `--ring` | `220 15% 15%` | `30 8% 15%` |
| `--accent` | `220 15% 15%` | `30 8% 15%` |

### Fil 2: `index.html` (rad 9)

Uppdatera meta theme-color fran `#f7f9fc` (kall bla) till `#faf9f7` (varm beige).

### Fil 3: `src/pages/Index.tsx` (rad 38)

Uppdatera den dynamiska ljusa theme-color fran `#f7f9fc` till `#faf9f7`.

---

### Resultat
Bakgrunden och alla gra-element far en varm, beige, sandaktig ton istallet for kall bla-gra. Morkt tema paverkas inte. Pastel-paletten behalls som den ar.

