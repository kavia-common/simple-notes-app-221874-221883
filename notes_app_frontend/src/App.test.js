import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

// Mock window.confirm to auto-accept
beforeAll(() => {
  jest.spyOn(window, 'confirm').mockImplementation(() => true);
});

beforeEach(() => {
  // Fresh localStorage per test
  window.localStorage.clear();
});

afterAll(() => {
  window.confirm.mockRestore();
});

function createNote(ui) {
  const newBtn = screen.getByRole('button', { name: /new note/i });
  fireEvent.click(newBtn);
  const titleInput = screen.getByLabelText(/title/i);
  fireEvent.change(titleInput, { target: { value: 'My Note' } });
  const contentInput = screen.getByLabelText(/content/i);
  fireEvent.change(contentInput, { target: { value: 'Body' } });
  return { titleInput, contentInput };
}

test('create, edit, and delete a note', () => {
  render(<App />);
  // Create
  createNote();
  expect(screen.getByText(/my note/i)).toBeInTheDocument();

  // Edit title
  const titleInput = screen.getByLabelText(/title/i);
  fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
  expect(screen.getByDisplayValue(/updated title/i)).toBeInTheDocument();

  // Delete
  const deleteBtn = screen.getByRole('button', { name: /delete note/i });
  fireEvent.click(deleteBtn);
  expect(screen.queryByText(/updated title/i)).not.toBeInTheDocument();
});

test('search filters notes', () => {
  render(<App />);
  // Create two notes
  fireEvent.click(screen.getByRole('button', { name: /new note/i }));
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Alpha' } });

  fireEvent.click(screen.getByRole('button', { name: /new note/i }));
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Beta' } });

  const search = screen.getByRole('searchbox', { name: /search notes/i });
  fireEvent.change(search, { target: { value: 'Alpha' } });

  const list = screen.getByRole('listbox');
  expect(within(list).getByText(/alpha/i)).toBeInTheDocument();
  expect(within(list).queryByText(/beta/i)).not.toBeInTheDocument();
});

test('pinning puts note on top', () => {
  render(<App />);
  // Create two notes
  fireEvent.click(screen.getByRole('button', { name: /new note/i }));
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'First' } });

  fireEvent.click(screen.getByRole('button', { name: /new note/i }));
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Second' } });

  const list = screen.getByRole('listbox');
  // Pin "First"
  const firstItem = within(list).getByText(/first/i).closest('[role="option"]');
  const pinButton = within(firstItem).getByRole('button', { name: /pin note|unpin note/i });
  fireEvent.click(pinButton);

  const options = within(list).getAllByRole('option');
  // First option should be the pinned one with title "First"
  expect(within(options[0]).getByText(/first/i)).toBeInTheDocument();
});

test('list and options expose a11y roles', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /new note/i }));
  const list = screen.getByRole('listbox');
  expect(list).toBeInTheDocument();
  const options = within(list).getAllByRole('option');
  expect(options.length).toBeGreaterThan(0);
});
