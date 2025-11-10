import React from 'react';

// PUBLIC_INTERFACE
export default function Header({ searchText, onSearchChange, onNewNote, onToggleTheme }) {
  /** Header containing title, search bar, and New Note button. */
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <h1 className="app-title">Notes</h1>
      </div>
      <div className="header-center">
        <label htmlFor="search-input" className="sr-only">Search notes</label>
        <input
          id="search-input"
          aria-label="Search notes"
          type="search"
          placeholder="Search notes..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="header-right">
        <button className="btn primary" onClick={onNewNote} aria-label="Create new note">
          + New Note
        </button>
        <button className="btn subtle" onClick={onToggleTheme} aria-label="Toggle theme">
          Theme
        </button>
      </div>
    </header>
  );
}
