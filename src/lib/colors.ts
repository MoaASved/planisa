import { PastelColor } from '@/types';

export const pastelColors: { value: PastelColor; label: string; class: string }[] = [
  { value: 'coral', label: 'Fern Green', class: 'bg-pastel-coral' },
  { value: 'peach', label: 'Pistachio', class: 'bg-pastel-peach' },
  { value: 'amber', label: 'Lagune', class: 'bg-pastel-amber' },
  { value: 'yellow', label: 'Sky', class: 'bg-pastel-yellow' },
  { value: 'mint', label: 'Peach', class: 'bg-pastel-mint' },
  { value: 'teal', label: 'Honey', class: 'bg-pastel-teal' },
  { value: 'sky', label: 'Peony', class: 'bg-pastel-sky' },
  { value: 'lavender', label: 'Rose', class: 'bg-pastel-lavender' },
  { value: 'rose', label: 'Soft Plum', class: 'bg-pastel-rose' },
  { value: 'gray', label: 'Warm Taupe', class: 'bg-pastel-gray' },
  { value: 'stone', label: 'Stone', class: 'bg-pastel-stone' },
];

export const getColorClass = (color: PastelColor): string => {
  return `bg-pastel-${color}`;
};

export const getColorBgClass = (color: PastelColor): string => {
  return `bg-pastel-${color}/20`;
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
    coral: 'bg-pastel-coral/40',
    peach: 'bg-pastel-peach/40',
    amber: 'bg-pastel-amber/40',
    yellow: 'bg-pastel-yellow/40',
    mint: 'bg-pastel-mint/40',
    teal: 'bg-pastel-teal/40',
    sky: 'bg-pastel-sky/40',
    lavender: 'bg-pastel-lavender/40',
    rose: 'bg-pastel-rose/40',
    gray: 'bg-pastel-gray/40',
    stone: 'bg-pastel-stone/40',
  };
  return colorMap[color] || 'bg-pastel-sky/40';
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
    coral: 'bg-pastel-coral/30',
    peach: 'bg-pastel-peach/30',
    amber: 'bg-pastel-amber/30',
    yellow: 'bg-pastel-yellow/30',
    mint: 'bg-pastel-mint/30',
    teal: 'bg-pastel-teal/30',
    sky: 'bg-pastel-sky/30',
    lavender: 'bg-pastel-lavender/30',
    rose: 'bg-pastel-rose/30',
    gray: 'bg-pastel-gray/30',
    stone: 'bg-pastel-stone/30',
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
