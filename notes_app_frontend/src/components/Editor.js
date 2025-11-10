import React, { useEffect, useRef, useState } from 'react';
import { DEBOUNCE } from '../utils/constants';

function useDebounced(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// PUBLIC_INTERFACE
export default function Editor({
  note,
  onUpdate,
  onDelete,
  onTogglePin,
  onAddTagToSearch,
}) {
  /** Editor for a single note with debounced saving and tag chips. */
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const titleRef = useRef(null);

  const debouncedTitle = useDebounced(title, DEBOUNCE.SAVE_MS);
  const debouncedContent = useDebounced(content, DEBOUNCE.SAVE_MS);

  useEffect(() => {
    // update internal state when note changes
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note?.id]); // switch by id only

  useEffect(() => {
    if (!note) return;
    onUpdate({
      ...note,
      title: debouncedTitle,
      content: debouncedContent,
      updatedAt: Date.now(),
    }, { typing: true }); // indicate high-frequency saves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  useEffect(() => {
    // focus on title when a new note is created
    if (titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [note?.id]);

  if (!note) {
    return (
      <main className="editor" role="main" aria-live="polite">
        <div className="empty-editor">Select or create a note to get started.</div>
      </main>
    );
  }

  const addTagsFromInput = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    const newTags = Array.from(new Set([...(note.tags || []), ...parts]));
    onUpdate({ ...note, tags: newTags, updatedAt: Date.now() });
    setTagInput('');
  };

  const removeTag = (t) => {
    const filtered = (note.tags || []).filter((x) => x !== t);
    onUpdate({ ...note, tags: filtered, updatedAt: Date.now() });
  };

  return (
    <main className="editor" role="main">
      <div className="editor-actions">
        <button
          className={`btn chip ${note.pinned ? 'active' : ''}`}
          onClick={() => onTogglePin(note.id)}
          aria-pressed={note.pinned}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          {note.pinned ? '📍 Unpin' : '📌 Pin'}
        </button>
        <button
          className="btn danger"
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
          title="Delete note"
        >
          Delete
        </button>
      </div>

      <div className="field">
        <label htmlFor="note-title">Title</label>
        <input
          id="note-title"
          ref={titleRef}
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
        />
      </div>

      <div className="field">
        <label htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          className="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing..."
          rows={16}
        />
      </div>

      <div className="field">
        <label htmlFor="note-tags">Tags</label>
        <div className="tags-row">
          <input
            id="note-tags"
            className="tags-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTagsFromInput();
              }
            }}
            placeholder="Add tags (Enter or comma)"
          />
          <button className="btn subtle" onClick={addTagsFromInput} aria-label="Add tag">Add</button>
        </div>
        <div className="note-tags">
          {(note.tags || []).map((t) => (
            <button
              key={t}
              className="tag-chip interactive"
              onClick={() => onAddTagToSearch(t)}
              onAuxClick={() => removeTag(t)}
              title="Click to filter by tag. Middle-click to remove."
              aria-label={`Tag ${t}`}
            >
              #{t}
              <span
                className="remove-tag"
                role="button"
                aria-label={`Remove tag ${t}`}
                onClick={(e) => { e.stopPropagation(); removeTag(t); }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
