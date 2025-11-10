export const STORAGE_KEYS = {
  NOTES: 'notes.v1',
  SELECTED_ID: 'notes.selected.v1',
  SEARCH: 'notes.search.v1',
};

export const DEBOUNCE = {
  SAVE_MS: 400,
  STORAGE_WRITE_MS: 300,
};

export const DEFAULTS = {
  NOTE: () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
    tags: [],
  }),
};

export const KEYBOARD = {
  NEW_NOTE: { ctrlKey: true, key: 'n' },
  DELETE: { key: 'Delete' },
  SEARCH_FOCUS: { ctrlKey: true, key: '/' },
  UP: { key: 'ArrowUp' },
  DOWN: { key: 'ArrowDown' },
};

export const FEATURE_FLAGS = (() => {
  let flags = {};
  try {
    const raw = process.env.REACT_APP_FEATURE_FLAGS;
    if (raw) {
      flags = JSON.parse(raw);
    }
  } catch (_e) {
    flags = {};
  }
  if (process.env.REACT_APP_NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('Feature flags active:', flags);
  }
  return {
    undoRedo: !!flags.undoRedo,
  };
})();

export const THEME = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    success: '#06b6d4',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
  },
};
