import { Theme } from '../types';

export const scifi: Theme = {
  id: 'scifi',
  name: 'Sci-Fi',
  colors: {
    background: '#020b18',
    surface: '#061220',
    surfaceAlt: '#0a1e30',
    border: '#1a4a6e',
    borderSubtle: '#0e2d45',
    primary: '#00d4ff',
    primaryForeground: '#020b18',
    accent: '#ff6b35',
    accentForeground: '#020b18',
    text: '#c8e8f8',
    textMuted: '#6a9fc0',
    textSubtle: '#2a5f80',
    character: '#00d4ff',
    location: '#00ff87',
    event: '#ffcc00',
    faction: '#ff6b35',
    item: '#bf5af2',
    concept: '#64748b',
  },
  fonts: {
    heading: 'Orbitron',
    body: 'IBM Plex Sans',
    mono: 'IBM Plex Mono',
  },
  borderRadius: 'none',
  animationSpeed: 'fast',
};
