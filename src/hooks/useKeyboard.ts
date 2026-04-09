import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

export function useKeyboard() {
  const setSearchOpen = useUIStore(s => s.setSearchOpen);
  const goBack = useUIStore(s => s.goBack);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchOpen, goBack]);
}
