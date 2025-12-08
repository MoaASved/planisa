import { PastelColor } from '@/types';

export const pastelColors: { value: PastelColor; label: string; class: string }[] = [
  { value: 'coral', label: 'Coral', class: 'bg-pastel-coral' },
  { value: 'peach', label: 'Peach', class: 'bg-pastel-peach' },
  { value: 'amber', label: 'Amber', class: 'bg-pastel-amber' },
  { value: 'yellow', label: 'Yellow', class: 'bg-pastel-yellow' },
  { value: 'mint', label: 'Mint', class: 'bg-pastel-mint' },
  { value: 'teal', label: 'Teal', class: 'bg-pastel-teal' },
  { value: 'sky', label: 'Sky', class: 'bg-pastel-sky' },
  { value: 'lavender', label: 'Lavender', class: 'bg-pastel-lavender' },
  { value: 'rose', label: 'Rose', class: 'bg-pastel-rose' },
  { value: 'gray', label: 'Gray', class: 'bg-pastel-gray' },
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
  };
  return colorMap[color] || 'text-muted-foreground';
};