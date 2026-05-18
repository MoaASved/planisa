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
  { value: 'flamingo', label: 'Flamingo', class: 'bg-pastel-flamingo' },
  { value: 'stone', label: 'Stone', class: 'bg-pastel-stone' },
  { value: 'pearl', label: 'Pearl', class: 'bg-pastel-pearl' },
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
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    pearl: 'bg-pastel-pearl ring-1 ring-inset ring-black/[0.06]',
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
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    pearl: 'bg-pastel-pearl',
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
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    pearl: 'bg-pastel-pearl',
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
    flamingo: 'text-pastel-flamingo',
    stone: 'text-pastel-stone',
    pearl: 'text-pastel-pearl',
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
    peach: 'bg-pastel-peach',
    honey: 'bg-pastel-honey',
    peony: 'bg-pastel-peony',
    rose: 'bg-pastel-rose',
    plum: 'bg-pastel-plum',
    flamingo: 'bg-pastel-flamingo',
    stone: 'bg-pastel-stone',
    pearl: 'bg-pastel-pearl',
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
    peach: 'bg-pastel-peach-accent',
    honey: 'bg-pastel-honey-accent',
    peony: 'bg-pastel-peony-accent',
    rose: 'bg-pastel-rose-accent',
    plum: 'bg-pastel-plum-accent',
    flamingo: 'bg-pastel-flamingo-accent',
    stone: 'bg-pastel-stone-accent',
    pearl: 'bg-pastel-pearl-accent',
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
    flamingo: 'text-pastel-flamingo-accent',
    stone: 'text-pastel-stone-accent',
    pearl: 'text-pastel-pearl-accent',
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
    flamingo: 'border-pastel-flamingo-accent',
    stone: 'border-pastel-stone-accent',
    pearl: 'border-pastel-pearl-accent',
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
    fern:       'hsl(87,  45%, 28%)',
    pistachio:  'hsl(98,  35%, 28%)',
    lagune:     'hsl(205, 55%, 28%)',
    sky:        'hsl(232, 55%, 32%)',
    peach:      'hsl(36,  65%, 30%)',
    honey:      'hsl(39,  70%, 28%)',
    peony:      'hsl(275, 45%, 30%)',
    rose:       'hsl(340, 60%, 32%)',
    plum:       'hsl(256, 50%, 30%)',
    flamingo:   'hsl(341, 55%, 35%)',
    stone:      'hsl(34,  28%, 35%)',
    pearl:      'hsl(36,  20%, 45%)',
  };
  return map[color] || 'hsl(0, 0%, 20%)';
};
