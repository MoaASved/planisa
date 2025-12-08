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

// Static color mapping for card backgrounds (90% opacity) - Tailwind JIT compatible
export const getColorCardClass = (color: PastelColor): string => {
  const colorMap: Record<PastelColor, string> = {
    coral: 'bg-pastel-coral/90',
    peach: 'bg-pastel-peach/90',
    amber: 'bg-pastel-amber/90',
    yellow: 'bg-pastel-yellow/90',
    mint: 'bg-pastel-mint/90',
    teal: 'bg-pastel-teal/90',
    sky: 'bg-pastel-sky/90',
    lavender: 'bg-pastel-lavender/90',
    rose: 'bg-pastel-rose/90',
    gray: 'bg-pastel-gray/90',
  };
  return colorMap[color] || 'bg-pastel-sky/90';
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