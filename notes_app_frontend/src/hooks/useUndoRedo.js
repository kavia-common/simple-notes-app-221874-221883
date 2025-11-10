import { useCallback, useRef, useState } from 'react';

/**
 * This hook manages a history stack for discrete actions (create, delete, pin, tag).
 * It is intentionally not used for high-frequency typing; callers should only push snapshots at appropriate checkpoints.
 */

// PUBLIC_INTERFACE
export function useUndoRedo(initial) {
  /** Provide history-enabled state with undo/redo controls. */
  const [present, setPresent] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);

  const set = useCallback((next, record = true) => {
    setPresent(prev => {
      if (record) {
        past.current.push(prev);
        future.current = [];
      }
      return typeof next === 'function' ? next(prev) : next;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop();
    future.current.push(present);
    setPresent(prev);
  }, [present]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    past.current.push(present);
    setPresent(next);
  }, [present]);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  const reset = useCallback((state) => {
    past.current = [];
    future.current = [];
    setPresent(state);
  }, []);

  return { state: present, set, undo, redo, canUndo, canRedo, reset };
}
