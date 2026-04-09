import { Theme } from '../types';

export const minimalist: Theme = {
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceAlt: '#f4f4f5',
    border: '#e4e4e7',
    borderSubtle: '#f0f0f1',
    primary: '#18181b',
    primaryForeground: '#fafafa',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    text: '#18181b',
    textMuted: '#71717a',
    textSubtle: '#a1a1aa',
    character: '#6366f1',
    location: '#059669',
    event: '#d97706',
    faction: '#db2777',
    item: '#7c3aed',
    concept: '#475569',
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Source Serif 4',
    mono: 'Fira Code',
  },
  borderRadius: 'sm',
  animationSpeed: 'normal',
};
