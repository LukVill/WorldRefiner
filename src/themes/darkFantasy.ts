import { Theme } from '../types';

export const darkFantasy: Theme = {
  id: 'dark-fantasy',
  name: 'Dark Fantasy',
  colors: {
    background: '#0f0d11',
    surface: '#1c1820',
    surfaceAlt: '#231f2b',
    border: '#3d3548',
    borderSubtle: '#2a2533',
    primary: '#c084fc',
    primaryForeground: '#0f0d11',
    accent: '#f87171',
    accentForeground: '#0f0d11',
    text: '#e8e3f0',
    textMuted: '#9d93b0',
    textSubtle: '#5c5570',
    character: '#818cf8',
    location: '#34d399',
    event: '#fbbf24',
    faction: '#f472b6',
    item: '#a78bfa',
    concept: '#94a3b8',
  },
  fonts: {
    heading: 'Cinzel',
    body: 'Crimson Pro',
    mono: 'JetBrains Mono',
  },
  borderRadius: 'md',
  animationSpeed: 'normal',
};
