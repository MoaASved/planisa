import { PastelColor } from '@/types';

export const pastelColors: { value: PastelColor; label: string; class: string }[] = [
  { value: 'coral', label: 'Fern', class: 'bg-pastel-coral' },
  { value: 'peach', label: 'Pistachio', class: 'bg-pastel-peach' },
  { value: 'amber', label: 'Lagune', class: 'bg-pastel-amber' },
  { value: 'yellow', label: 'Sky', class: 'bg-pastel-yellow' },
  { value: 'mint', label: 'Peach', class: 'bg-pastel-mint' },
  { value: 'teal', label: 'Honey', class: 'bg-pastel-teal' },
  { value: 'sky', label: 'Peony', class: 'bg-pastel-sky' },
  { value: 'lavender', label: 'Rose', class: 'bg-pastel-lavender' },
  { value: 'rose', label: 'Plum', class: 'bg-pastel-rose' },
  { value: 'gray', label: 'Taupe', class: 'bg-pastel-gray' },
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

// Static color mapping for card backgrounds (40% opacity for sheer, calm appearance) - Tailwind JIT compatible
export const getColorCardClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-sky';
};

// Static color mapping for dot indicators (full opacity) - Tailwind JIT compatible
export const getColorDotClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-sky';
};

// Static color mapping for avatar backgrounds (30% opacity) - Tailwind JIT compatible
export const getAvatarBgClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-secondary';
};

// Static color mapping for avatar text colors - Tailwind JIT compatible
export const getAvatarTextClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'text-pastel-coral',
    peach: 'text-pastel-peach',
    amber: 'text-pastel-amber',
    yellow: 'text-pastel-yellow',
    mint: 'text-pastel-mint',
    teal: 'text-pastel-teal',
    sky: 'text-pastel-sky',
    lavender: 'text-pastel-lavender',
    rose: 'text-pastel-rose',
    gray: 'text-pastel-gray',
    stone: 'text-pastel-stone',
  };
  return colorMap[color] || 'text-muted-foreground';
};

// Static color mapping for stripe indicators (full opacity) - Tailwind JIT compatible
export const getColorStripeClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral',
    peach: 'bg-pastel-peach',
    amber: 'bg-pastel-amber',
    yellow: 'bg-pastel-yellow',
    mint: 'bg-pastel-mint',
    teal: 'bg-pastel-teal',
    sky: 'bg-pastel-sky',
    lavender: 'bg-pastel-lavender',
    rose: 'bg-pastel-rose',
    gray: 'bg-pastel-gray',
    stone: 'bg-pastel-stone',
  };
  return colorMap[color] || 'bg-pastel-sky';
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
    coral: 'bg-pastel-coral-accent',
    peach: 'bg-pastel-peach-accent',
    amber: 'bg-pastel-amber-accent',
    yellow: 'bg-pastel-yellow-accent',
    mint: 'bg-pastel-mint-accent',
    teal: 'bg-pastel-teal-accent',
    sky: 'bg-pastel-sky-accent',
    lavender: 'bg-pastel-lavender-accent',
    rose: 'bg-pastel-rose-accent',
    gray: 'bg-pastel-gray-accent',
    stone: 'bg-pastel-stone-accent',
  };
  return map[color] || 'bg-pastel-sky-accent';
};

export const getAccentTextClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    coral: 'text-pastel-coral-accent',
    peach: 'text-pastel-peach-accent',
    amber: 'text-pastel-amber-accent',
    yellow: 'text-pastel-yellow-accent',
    mint: 'text-pastel-mint-accent',
    teal: 'text-pastel-teal-accent',
    sky: 'text-pastel-sky-accent',
    lavender: 'text-pastel-lavender-accent',
    rose: 'text-pastel-rose-accent',
    gray: 'text-pastel-gray-accent',
    stone: 'text-pastel-stone-accent',
  };
  return map[color] || 'text-pastel-sky-accent';
};

export const getAccentBorderClass = (color: PastelColor): string => {
  const map: Record<PastelColor, string> = {
    coral: 'border-pastel-coral-accent',
    peach: 'border-pastel-peach-accent',
    amber: 'border-pastel-amber-accent',
    yellow: 'border-pastel-yellow-accent',
    mint: 'border-pastel-mint-accent',
    teal: 'border-pastel-teal-accent',
    sky: 'border-pastel-sky-accent',
    lavender: 'border-pastel-lavender-accent',
    rose: 'border-pastel-rose-accent',
    gray: 'border-pastel-gray-accent',
    stone: 'border-pastel-stone-accent',
  };
  return map[color] || 'border-pastel-sky-accent';
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


