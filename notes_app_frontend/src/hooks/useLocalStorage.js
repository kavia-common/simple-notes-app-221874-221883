import { useEffect, useRef, useState } from 'react';
import { DEBOUNCE } from '../utils/constants';

/**
 * Debounce helper
 */
function useDebouncedEffect(effect, deps, delay) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

// PUBLIC_INTERFACE
export function useLocalStorage(key, initialValue) {
  /** React hook to bind state to localStorage with safe JSON parsing and debounced writes. */
  const isFirstLoad = useRef(true);
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useDebouncedEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [value, key], DEBOUNCE.STORAGE_WRITE_MS);

  // keep state in sync if other tabs modify localStorage
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === key) {
        try {
          setValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch {
          setValue(initialValue);
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, initialValue]);

  return [value, setValue];
}
