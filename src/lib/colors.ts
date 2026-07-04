import { PastelColor } from '@/types';

export const pastelColors: { value: PastelColor; label: string; class: string }[] = [
  { value: 'fern', label: 'Fern', class: 'bg-pastel-fern' },
  { value: 'pistachio', label: 'Pistachio', class: 'bg-pastel-pistachio' },
  { value: 'lagune', label: 'Lagune', class: 'bg-pastel-lagune' },
  { value: 'sky', label: 'Sky', class: 'bg-pastel-sky' },
  { value: 'honey', label: 'Honey', class: 'bg-pastel-honey' },
  { value: 'peach', label: 'Peach', class: 'bg-pastel-peach' },
  { value: 'plum', label: 'Plum', class: 'bg-pastel-plum' },
  { value: 'peony', label: 'Peony', class: 'bg-pastel-peony' },
  { value: 'rose', label: 'Rose', class: 'bg-pastel-rose' },
  { value: 'flamingo', label: 'Flamingo', class: 'bg-pastel-flamingo' },
  { value: 'stone', label: 'Stone', class: 'bg-pastel-stone' },
  { value: 'radicchio', label: 'Radicchio', class: 'bg-pastel-radicchio' },
  { value: 'mango', label: 'Mango', class: 'bg-pastel-mango' },
  { value: 'amethyst', label: 'Amethyst', class: 'bg-pastel-amethyst' },
  { value: 'cocoa', label: 'Cocoa', class: 'bg-pastel-cocoa' },
  { value: 'birch', label: 'Birch', class: 'bg-pastel-birch' },
  { value: 'graphite', label: 'Graphite', class: 'bg-pastel-graphite' },
];
// 'none' is intentionally excluded from pastelColors — it appears as a separate swatch in event color pickers

export const getColorClass = (color: PastelColor): string => {
  if (color === 'none') return 'bg-pastel-none border border-pastel-none-accent';
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
 * of a pastel sticky-note background. All pastel surfaces are light enough that
 * the dark neutral #2C2C2A gives better contrast than theme-foreground.
 */
export const getStickyTextClass = (_color?: PastelColor): string => {
  return 'text-[#2C2C2A]';
};

// Static color mapping for card backgrounds - Tailwind JIT compatible
export const getColorCardClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    honey: 'bg-pastel-honey',
    peach: 'bg-pastel-peach',
    plum: 'bg-pastel-plum',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    none: 'bg-pastel-none border border-[hsl(27_6%_65%)]',
    radicchio: 'bg-pastel-radicchio',
    mango: 'bg-pastel-mango',
    amethyst: 'bg-pastel-amethyst',
    cocoa: 'bg-pastel-cocoa',
    birch: 'bg-pastel-birch',
    graphite: 'bg-pastel-graphite',
  };
  return colorMap[color] || 'bg-pastel-peony';
};

// Static color mapping for dot indicators - Tailwind JIT compatible
export const getColorDotClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    honey: 'bg-pastel-honey',
    peach: 'bg-pastel-peach',
    plum: 'bg-pastel-plum',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    none: 'bg-pastel-none',
    radicchio: 'bg-pastel-radicchio',
    mango: 'bg-pastel-mango',
    amethyst: 'bg-pastel-amethyst',
    cocoa: 'bg-pastel-cocoa',
    birch: 'bg-pastel-birch',
    graphite: 'bg-pastel-graphite',
  };
  return colorMap[color] || 'bg-pastel-peony';
};

// Static color mapping for avatar backgrounds - Tailwind JIT compatible
export const getAvatarBgClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    honey: 'bg-pastel-honey',
    peach: 'bg-pastel-peach',
    plum: 'bg-pastel-plum',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    none: 'bg-pastel-none',
    radicchio: 'bg-pastel-radicchio',
    mango: 'bg-pastel-mango',
    amethyst: 'bg-pastel-amethyst',
    cocoa: 'bg-pastel-cocoa',
    birch: 'bg-pastel-birch',
    graphite: 'bg-pastel-graphite',
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
    honey: 'text-pastel-honey',
    peach: 'text-pastel-peach',
    plum: 'text-pastel-plum',
    peony: 'text-pastel-peony',
    rose: 'text-pastel-rose',
    flamingo: 'text-pastel-flamingo',
    stone: 'text-pastel-stone',
    none: 'text-pastel-none-accent',
    radicchio: 'text-pastel-radicchio',
    mango: 'text-pastel-mango',
    amethyst: 'text-pastel-amethyst',
    cocoa: 'text-pastel-cocoa',
    birch: 'text-pastel-birch',
    graphite: 'text-pastel-graphite',
  };
  return colorMap[color] || 'text-muted-foreground';
};

// Static color mapping for stripe indicators - Tailwind JIT compatible
export const getColorStripeClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern',
    pistachio: 'bg-pastel-pistachio',
    lagune: 'bg-pastel-lagune',
    sky: 'bg-pastel-sky',
    honey: 'bg-pastel-honey',
    peach: 'bg-pastel-peach',
    plum: 'bg-pastel-plum',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    none: 'bg-pastel-none',
    radicchio: 'bg-pastel-radicchio',
    mango: 'bg-pastel-mango',
    amethyst: 'bg-pastel-amethyst',
    cocoa: 'bg-pastel-cocoa',
    birch: 'bg-pastel-birch',
    graphite: 'bg-pastel-graphite',
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
// ============================================================

export const getAccentDotClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'bg-pastel-fern-accent',
    pistachio: 'bg-pastel-pistachio-accent',
    lagune: 'bg-pastel-lagune-accent',
    sky: 'bg-pastel-sky-accent',
    honey: 'bg-pastel-honey-accent',
    peach: 'bg-pastel-peach-accent',
    plum: 'bg-pastel-plum-accent',
    peony: 'bg-pastel-peony-accent',
    rose: 'bg-pastel-rose-accent',
    flamingo: 'bg-pastel-flamingo-accent',
    stone: 'bg-pastel-stone-accent',
    none: 'bg-pastel-none-accent',
    radicchio: 'bg-pastel-radicchio-accent',
    mango: 'bg-pastel-mango-accent',
    amethyst: 'bg-pastel-amethyst-accent',
    cocoa: 'bg-pastel-cocoa-accent',
    birch: 'bg-pastel-birch-accent',
    graphite: 'bg-pastel-graphite-accent',
  };
  return map[color] || 'bg-pastel-peony-accent';
};

export const getAccentTextClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'text-pastel-fern-accent',
    pistachio: 'text-pastel-pistachio-accent',
    lagune: 'text-pastel-lagune-accent',
    sky: 'text-pastel-sky-accent',
    honey: 'text-pastel-honey-accent',
    peach: 'text-pastel-peach-accent',
    plum: 'text-pastel-plum-accent',
    peony: 'text-pastel-peony-accent',
    rose: 'text-pastel-rose-accent',
    flamingo: 'text-pastel-flamingo-accent',
    stone: 'text-pastel-stone-accent',
    none: 'text-pastel-none-accent',
    radicchio: 'text-pastel-radicchio-accent',
    mango: 'text-pastel-mango-accent',
    amethyst: 'text-pastel-amethyst-accent',
    cocoa: 'text-pastel-cocoa-accent',
    birch: 'text-pastel-birch-accent',
    graphite: 'text-pastel-graphite-accent',
  };
  return map[color] || 'text-pastel-peony-accent';
};

export const getAccentBorderClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern: 'border-pastel-fern-accent',
    pistachio: 'border-pastel-pistachio-accent',
    lagune: 'border-pastel-lagune-accent',
    sky: 'border-pastel-sky-accent',
    honey: 'border-pastel-honey-accent',
    peach: 'border-pastel-peach-accent',
    plum: 'border-pastel-plum-accent',
    peony: 'border-pastel-peony-accent',
    rose: 'border-pastel-rose-accent',
    flamingo: 'border-pastel-flamingo-accent',
    stone: 'border-pastel-stone-accent',
    none: 'border-pastel-none-accent',
    radicchio: 'border-pastel-radicchio-accent',
    mango: 'border-pastel-mango-accent',
    amethyst: 'border-pastel-amethyst-accent',
    cocoa: 'border-pastel-cocoa-accent',
    birch: 'border-pastel-birch-accent',
    graphite: 'border-pastel-graphite-accent',
  };
  return map[color] || 'border-pastel-peony-accent';
};

export const getAccentBgClass = (color: PastelColor): string => getAccentDotClass(color);

export const getAccentVar = (color: PastelColor): string => {
  return `hsl(var(--pastel-${color}-accent))`;
};

// Soft vertical gradient using ONLY the card's own color:
// top = lighter tint (mixed with white), bottom = full color.
export const getColorGradient = (color: PastelColor): string => {
  const base = `hsl(var(--pastel-${color}))`;
  const lighter = `color-mix(in srgb, ${base} 55%, white)`;
  return `linear-gradient(to bottom, ${lighter} 0%, ${base} 100%)`;
};

// Dark hue-tinted text color for use on pastel card backgrounds.
// Same hue as the pastel but at ~L30-35% so it reads clearly without being flat black.
export const getDeepTextColor = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    fern:      'hsl(86,  38%, 28%)',
    pistachio: 'hsl(98,  35%, 28%)',
    lagune:    'hsl(205, 55%, 28%)',
    sky:       'hsl(232, 55%, 32%)',
    honey:     'hsl(45,  70%, 28%)',
    peach:     'hsl(36,  65%, 30%)',
    plum:      'hsl(256, 50%, 30%)',
    peony:     'hsl(275, 45%, 30%)',
    rose:      'hsl(340, 60%, 32%)',
    flamingo:  'hsl(342, 58%, 36%)',
    stone:     'hsl(34,  28%, 35%)',
    none:      'hsl(27,  8%, 28%)',
    radicchio: 'hsl(344, 62%, 22%)',
    mango:     'hsl(37,  88%, 28%)',
    amethyst:  'hsl(261, 35%, 30%)',
    cocoa:     'hsl(16,  28%, 20%)',
    birch:     'hsl(15,  18%, 35%)',
    graphite:  'hsl(0,   0%,  20%)',
  };
  return map[color] || 'hsl(0, 0%, 20%)';
};
