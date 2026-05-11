import { PastelColor } from '@/types';

export const pastelColors: { value: PastelColor; label: string; class: string }[] = [
  { value: 'fern', label: 'Fern', class: 'bg-pastel-fern' },
  { value: 'pistachio', label: 'Pistachio', class: 'bg-pastel-pistachio' },
  { value: 'lagune', label: 'Lagune', class: 'bg-pastel-lagune' },
  { value: 'sky', label: 'Sky', class: 'bg-pastel-sky' },
  { value: 'peach', label: 'Peach', class: 'bg-pastel-peach' },
  { value: 'honey', label: 'Honey', class: 'bg-pastel-honey' },
  { value: 'peony', label: 'Peony', class: 'bg-pastel-peony' },
  { value: 'rose', label: 'Rose', class: 'bg-pastel-rose' },
  { value: 'plum', label: 'Plum', class: 'bg-pastel-plum' },
  { value: 'taupe', label: 'Taupe', class: 'bg-pastel-taupe' },
  { value: 'stone', label: 'Stone', class: 'bg-pastel-stone' },
];

export const getColorClass = (color: PastelColor): string => {
  return `bg-pastel-${color}`;
};

export const getColorBgClass = (color: PastelColor): string => {
  return `bg-pastel-${color}`;
};

export const getColorTextClass = (color: PastelColor): string => {
  return `text-pastel-${color}`;
};

export const getBadgeClass = (color: PastelColor): string => {
  return `flow-badge-${color}`;
};

/**
 * Returns the appropriate Tailwind text-color class for content rendered on top
 * of a pastel sticky-note background. All pastel surfaces are light enough in
 * both light mode (L 81–88%) and dark mode (L 51–87%) that the dark neutral
 * #2C2C2A gives better contrast than theme-foreground (which becomes near-white
 * in dark mode and would be unreadable on the lighter pastels).
 *
 * Light-in-dark-mode pastels that especially need this (L ≥ 65%):
 *   yellow (Sky, 87%), lavender (Rose, 85%), stone (84%), teal (Honey, 76%),
 *   mint (Peach, 75%), peach (Pistachio, 69%)
 *
 * Medium-in-dark-mode pastels where dark text still wins on contrast (L 51–58%):
 *   coral (Fern, 51%), amber (Lagune, 53%), sky (Peony, 56%),
 *   rose (Plum, 57%), gray (Taupe, 58%)
 */
export const getStickyTextClass = (_color?: PastelColor): string => {
  return 'text-[#2C2C2A]';
};

// Static color mapping for card backgrounds (40% opacity for sheer, calm appearance) - Tailwind JIT compatible
export const getColorCardClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    taupe: 'bg-pastel-taupe',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-peony';
};

// Static color mapping for dot indicators (full opacity) - Tailwind JIT compatible
export const getColorDotClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    taupe: 'bg-pastel-taupe',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-peony';
};

// Static color mapping for avatar backgrounds (30% opacity) - Tailwind JIT compatible
export const getAvatarBgClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    taupe: 'bg-pastel-taupe',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-secondary';
};

// Static color mapping for avatar text colors - Tailwind JIT compatible
export const getAvatarTextClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'text-pastel-fern',
    pistachio: 'text-pastel-pistachio',
    lagune: 'text-pastel-lagune',
    sky: 'text-pastel-sky',
    peach: 'text-pastel-peach',
    honey: 'text-pastel-honey',
    peony: 'text-pastel-peony',
    rose: 'text-pastel-rose',
    plum: 'text-pastel-plum',
    taupe: 'text-pastel-taupe',
    stone: 'text-pastel-stone',
  };
  return colorMap[color] || 'text-muted-foreground';
};

// Static color mapping for stripe indicators (full opacity) - Tailwind JIT compatible
export const getColorStripeClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    taupe: 'bg-pastel-taupe',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-peony';
};

// Get CSS color value for inline styles (gradients etc.) - Tailwind JIT compatible
export const getColorVar = (color: PastelColor): string => {
  return `hsl(var(--pastel-${color}))`;
};

// ============================================================
// ACCENT (Dark palette) helpers — for icons, dots, indicators,
// tags, badges, thin elements, and active states even in Light Mode.
// Light surfaces stay soft; details get crisp dark accents.
// ============================================================

export const getAccentDotClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern-accent',
    pistachio: 'bg-pastel-pistachio-accent',
    lagune: 'bg-pastel-lagune-accent',
    sky: 'bg-pastel-sky-accent',
    peach: 'bg-pastel-peach-accent',
    honey: 'bg-pastel-honey-accent',
    peony: 'bg-pastel-peony-accent',
    rose: 'bg-pastel-rose-accent',
    plum: 'bg-pastel-plum-accent',
    taupe: 'bg-pastel-taupe-accent',
    stone: 'bg-pastel-stone-accent',
  };
  return map[color] || 'bg-pastel-peony-accent';
};

export const getAccentTextClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'text-pastel-fern-accent',
    pistachio: 'text-pastel-pistachio-accent',
    lagune: 'text-pastel-lagune-accent',
    sky: 'text-pastel-sky-accent',
    peach: 'text-pastel-peach-accent',
    honey: 'text-pastel-honey-accent',
    peony: 'text-pastel-peony-accent',
    rose: 'text-pastel-rose-accent',
    plum: 'text-pastel-plum-accent',
    taupe: 'text-pastel-taupe-accent',
    stone: 'text-pastel-stone-accent',
  };
  return map[color] || 'text-pastel-peony-accent';
};

export const getAccentBorderClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'border-pastel-fern-accent',
    pistachio: 'border-pastel-pistachio-accent',
    lagune: 'border-pastel-lagune-accent',
    sky: 'border-pastel-sky-accent',
    peach: 'border-pastel-peach-accent',
    honey: 'border-pastel-honey-accent',
    peony: 'border-pastel-peony-accent',
    rose: 'border-pastel-rose-accent',
    plum: 'border-pastel-plum-accent',
    taupe: 'border-pastel-taupe-accent',
    stone: 'border-pastel-stone-accent',
  };
  return map[color] || 'border-pastel-peony-accent';
};

export const getAccentBgClass = (color: PastelColor): string => getAccentDotClass(color);

export const getAccentVar = (color: PastelColor): string => {
  return `hsl(var(--pastel-${color}-accent))`;
};

// Soft vertical gradient using ONLY the card's own color:
// top = lighter tint (mixed with white), bottom = full color.
// No black, grey, or dark overlays.
export const getColorGradient = (color: PastelColor): string => {
  const base = `hsl(var(--pastel-${color}))`;
  const lighter = `color-mix(in srgb, ${base} 55%, white)`;
  return `linear-gradient(to bottom, ${lighter} 0%, ${base} 100%)`;
};


