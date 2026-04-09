import { useEffect } from 'react';
import { useWorldStore } from '../store/worldStore';
import { applyTheme } from '../themes/index';

export function useTheme() {
  const theme = useWorldStore(s => s.world?.theme);
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
  }, [theme]);
}
