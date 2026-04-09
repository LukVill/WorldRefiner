import { Theme } from '../types';
import { darkFantasy } from './darkFantasy';
import { scifi } from './scifi';
import { minimalist } from './minimalist';

export const themes: Theme[] = [darkFantasy, scifi, minimalist];
export { darkFantasy, scifi, minimalist };

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function loadGoogleFonts(fontNames: string[]) {
  const unique = [...new Set(fontNames)];
  unique.forEach(font => {
    const id = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  });
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${kebabCase(key)}`, value);
  });
  const radiusMap = { none: '0px', sm: '4px', md: '8px', lg: '12px', full: '9999px' };
  root.style.setProperty('--radius', radiusMap[theme.borderRadius]);
  const speedMap = { none: '0ms', slow: '400ms', normal: '200ms', fast: '100ms' };
  root.style.setProperty('--anim-speed', speedMap[theme.animationSpeed]);
  loadGoogleFonts([theme.fonts.heading, theme.fonts.body, theme.fonts.mono]);
  root.style.setProperty('--font-heading', `'${theme.fonts.heading}', serif`);
  root.style.setProperty('--font-body', `'${theme.fonts.body}', serif`);
  root.style.setProperty('--font-mono', `'${theme.fonts.mono}', monospace`);
}
