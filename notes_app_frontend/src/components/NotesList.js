import React, { useEffect, useRef } from 'react';

function NoteListItem({ note, active, onSelect, onTogglePin, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      className={`note-item ${active ? 'active' : ''} ${note.pinned ? 'pinned' : ''}`}
      onClick={() => onSelect(note.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(note.id);
      }}
    >
      <div className="note-item-main">
        <div className="note-title-row">
          <span className="note-title">{note.title || 'Untitled'}</span>
          {note.pinned && <span className="pin-indicator" aria-label="Pinned">📌</span>}
        </div>
        <div className="note-snippet">{note.content?.slice(0, 120)}</div>
        <div className="note-tags">
          {(note.tags || []).map((t) => (
            <span key={t} className="tag-chip" data-tag={t} title={`Tag: ${t}`}>
              #{t}
            </span>
          ))}
        </div>
      </div>
      <div className="note-item-actions">
        <button
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? '📍' : '📌'}
        </button>
        <button
          className="icon-btn danger"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          aria-label="Delete note"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onTogglePin,
  onDelete,
  onKeyNavigate,
}) {
  /** Renders the notes list with keyboard navigation and actions. */
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onKeyNavigate(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onKeyNavigate(-1);
      }
    }
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [onKeyNavigate]);

  return (
    <nav className="sidebar" aria-label="Notes list">
      <div
        ref={containerRef}
        role="listbox"
        tabIndex={0}
        aria-activedescendant={selectedId || undefined}
        className="notes-list"
      >
        {notes.map((n) => (
          <NoteListItem
            key={n.id}
            note={n}
            active={n.id === selectedId}
            onSelect={onSelect}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        ))}
        {notes.length === 0 && (
          <div className="empty-list" role="note" aria-live="polite">
            No notes found
          </div>
        )}
      </div>
    </nav>
  );
}
