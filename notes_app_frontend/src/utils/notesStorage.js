import { STORAGE_KEYS } from './constants';

/**
 * Safely parse JSON with fallback.
 */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Basic migration placeholder for future versions.
 * Currently returns notes unchanged.
 */
function migrateNotes(notes) {
  // Future migration logic can go here.
  return Array.isArray(notes) ? notes : [];
}

// PUBLIC_INTERFACE
export function loadNotes() {
  /** Load notes from localStorage and run migration if needed. */
  const raw = window.localStorage.getItem(STORAGE_KEYS.NOTES);
  const data = safeParse(raw, []);
  return migrateNotes(data);
}

// PUBLIC_INTERFACE
export function saveNotes(notes) {
  /** Save notes array to localStorage. */
  try {
    window.localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch {
    // ignore quota errors
  }
}

// PUBLIC_INTERFACE
export function exportNotesJSON(notes) {
  /** Export notes to a downloadable JSON string. */
  return JSON.stringify({ version: 1, notes }, null, 2);
}

// PUBLIC_INTERFACE
export function importNotesJSON(json) {
  /** Import notes JSON string, returns migrated notes array or [] on error. */
  const parsed = safeParse(json, null);
  if (!parsed || !Array.isArray(parsed.notes)) return [];
  return migrateNotes(parsed.notes);
}

// PUBLIC_INTERFACE
export function loadSelectedNoteId() {
  /** Load selected note id from localStorage. */
  const raw = window.localStorage.getItem(STORAGE_KEYS.SELECTED_ID);
  return raw || null;
}

// PUBLIC_INTERFACE
export function saveSelectedNoteId(id) {
  /** Persist selected note id to localStorage. */
  try {
    if (id) {
      window.localStorage.setItem(STORAGE_KEYS.SELECTED_ID, id);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.SELECTED_ID);
    }
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function loadSearchText() {
  /** Load persisted search text. */
  return window.localStorage.getItem(STORAGE_KEYS.SEARCH) || '';
}

// PUBLIC_INTERFACE
export function saveSearchText(text) {
  /** Persist search text. */
  try {
    window.localStorage.setItem(STORAGE_KEYS.SEARCH, text || '');
  } catch {
    // ignore
  }
}
