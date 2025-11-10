import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import Header from './components/Header';
import NotesList from './components/NotesList';
import Editor from './components/Editor';
import { DEFAULTS, FEATURE_FLAGS } from './utils/constants';
import {
  loadNotes,
  saveNotes,
  loadSelectedNoteId,
  saveSelectedNoteId,
  loadSearchText,
  saveSearchText,
} from './utils/notesStorage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useUndoRedo } from './hooks/useUndoRedo';

// PUBLIC_INTERFACE
function App() {
  /** Main Notes application with split layout and localStorage persistence. */

  // Theme handling with default DARK mode and persisted preference
  const [theme, setTheme] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ui.theme');
      // If a saved preference exists, use it; otherwise default to dark
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // On mount, ensure initial paint sets data-theme correctly even before any user interaction
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ui.theme');
      const initial = saved === 'light' || saved === 'dark' ? saved : 'dark';
      document.documentElement.setAttribute('data-theme', initial);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('ui.theme', theme);
    } catch {
      // ignore quota errors
    }
  }, [theme]);

  // Notes persistence using dedicated storage util + a mirrored localStorage hook for easy reactivity
  const [notesLS, setNotesLS] = useLocalStorage('notes.v1', loadNotes());
  const [selectedId, setSelectedId] = useState(loadSelectedNoteId());
  const [searchText, setSearchText] = useState(loadSearchText());

  // Optional undo/redo - only for discrete actions
  const undoEnabled = FEATURE_FLAGS.undoRedo;
  const history = useUndoRedo(notesLS);
  const notes = undoEnabled ? history.state : notesLS;

  useEffect(() => {
    // Persist notes and selection/search
    saveNotes(notes);
  }, [notes]);
  useEffect(() => {
    saveSelectedNoteId(selectedId);
  }, [selectedId]);
  useEffect(() => {
    saveSearchText(searchText);
  }, [searchText]);

  // Sorting: pinned first, then updatedAt desc
  const sortedNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [notes]);

  // Search filter
  const filteredNotes = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    if (!q) return sortedNotes;
    return sortedNotes.filter((n) => {
      const inTitle = (n.title || '').toLowerCase().includes(q);
      const inContent = (n.content || '').toLowerCase().includes(q);
      const inTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inContent || inTags;
    });
  }, [sortedNotes, searchText]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  // Helpers to set notes with/without history
  const setNotes = useCallback((updater, { record = true } = {}) => {
    if (undoEnabled) {
      history.set(updater, record);
    } else {
      setNotesLS(typeof updater === 'function' ? updater(notes) : updater);
    }
  }, [history, undoEnabled, setNotesLS, notes]);

  // Create new note: insert at top, select it
  const handleNewNote = useCallback(() => {
    const newNote = DEFAULTS.NOTE();
    // put at front by updating updatedAt to now
    newNote.updatedAt = Date.now();
    setNotes((prev) => [newNote, ...prev], { record: true });
    setSelectedId(newNote.id);
    setTimeout(() => {
      const titleEl = document.getElementById('note-title');
      if (titleEl) titleEl.focus();
    }, 0);
  }, [setNotes]);

  // Update note (debounced inside editor for typing)
  const handleUpdateNote = useCallback((updated, meta = {}) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)), {
      record: !meta.typing, // don't record high-frequency typing in history
    });
  }, [setNotes]);

  // Delete note with confirmation; select next logical
  const handleDeleteNote = useCallback((id) => {
    // eslint-disable-next-line no-restricted-globals
    const ok = window.confirm('Delete this note? This cannot be undone.');
    if (!ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== id), { record: true });
    if (selectedId === id) {
      // select next in filtered order
      const idx = filteredNotes.findIndex((n) => n.id === id);
      if (idx >= 0) {
        const next = filteredNotes[idx + 1] || filteredNotes[idx - 1] || null;
        setSelectedId(next ? next.id : null);
      } else {
        setSelectedId(null);
      }
    }
  }, [filteredNotes, selectedId, setNotes]);

  // Toggle pin and update updatedAt
  const handleTogglePin = useCallback((id) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n)),
      { record: true }
    );
  }, [setNotes]);

  // Select note
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e) {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      } else if (e.key === 'Delete' && selectedNote) {
        e.preventDefault();
        handleDeleteNote(selectedNote.id);
      } else if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        const searchEl = document.getElementById('search-input');
        if (searchEl) searchEl.focus();
      } else if (e.ctrlKey && undoEnabled && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        history.undo();
      } else if (e.ctrlKey && undoEnabled && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        history.redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNewNote, handleDeleteNote, selectedNote, undoEnabled, history]);

  // Navigate up/down in list
  const handleKeyNavigate = useCallback((delta) => {
    if (filteredNotes.length === 0) return;
    const idx = filteredNotes.findIndex((n) => n.id === selectedId);
    const nextIdx = idx < 0 ? 0 : Math.max(0, Math.min(filteredNotes.length - 1, idx + delta));
    const next = filteredNotes[nextIdx];
    if (next) setSelectedId(next.id);
  }, [filteredNotes, selectedId]);

  const onAddTagToSearch = useCallback((tag) => {
    const q = searchText?.trim();
    const newQ = q ? `${q} ${tag}` : tag;
    setSearchText(newQ);
  }, [searchText]);

  return (
    <div className="app-root">
      <Header
        searchText={searchText}
        onSearchChange={setSearchText}
        onNewNote={handleNewNote}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        onResetTheme={() => {
          try {
            window.localStorage.removeItem('ui.theme');
          } catch {
            // ignore storage errors
          }
          // Reset to default (dark) since app defaults are dark
          document.documentElement.setAttribute('data-theme', 'dark');
          setTheme('dark');
        }}
      />
      <div className="content">
        <NotesList
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={handleSelect}
          onTogglePin={handleTogglePin}
          onDelete={handleDeleteNote}
          onKeyNavigate={handleKeyNavigate}
        />
        <Editor
          note={selectedNote}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          onTogglePin={handleTogglePin}
          onAddTagToSearch={onAddTagToSearch}
        />
      </div>
      {undoEnabled && (
        <div className="undo-redo-hint" aria-live="polite">
          Undo/Redo enabled (Ctrl+Z / Ctrl+Y)
        </div>
      )}
    </div>
  );
}

export default App;
