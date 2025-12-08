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