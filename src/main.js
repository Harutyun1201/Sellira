import { createEditor } from './editor.js';

const noteList = document.getElementById('noteList');
const noteTitle = document.getElementById('noteTitle');
const newNoteBtn = document.getElementById('newNote');
const toggleThemeBtn = document.getElementById('toggleTheme');
const searchInput = document.getElementById('searchInput');
const app = document.getElementById('app');

let notes = JSON.parse(localStorage.getItem('sellira-notes')) || {};
let currentNote = localStorage.getItem('sellira-current') || 'Home';
let editor;

function saveNotes() {
  localStorage.setItem('sellira-notes', JSON.stringify(notes));
  localStorage.setItem('sellira-current', currentNote);
}

function loadNote(name) {
  if (!notes[name]) notes[name] = '';
  currentNote = name;
  noteTitle.textContent = name;
  updateEditor(notes[name]);
  saveNotes();
}

function updateEditor(content) {
  if (editor) editor.destroy();

  const isDark = app.classList.contains('dark-mode');
  editor = createEditor(document.getElementById('editor'), content, isDark, (updated) => {
    notes[currentNote] = updated;
    saveNotes();
  });

  updateNoteList();
}

function renderFilteredNoteList(query) {
  noteList.innerHTML = '';
  Object.keys(notes).forEach(name => {
    if (!query || name.toLowerCase().includes(query)) {
      const li = document.createElement('li');
      if (name === currentNote) li.classList.add('active');

      if (query) {
        const matchStart = name.toLowerCase().indexOf(query);
        const matchEnd = matchStart + query.length;
        const highlighted = name.substring(matchStart, matchEnd);
        const before = name.substring(0, matchStart);
        const after = name.substring(matchEnd);
        li.innerHTML = `${before}<mark>${highlighted}</mark>${after}`;
      } else {
        li.textContent = name;
      }

      li.onclick = () => loadNote(name);

      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const choice = prompt(`Actions for "${name}":\n1. Delete\n2. Cancel`, "1");
        if (choice === '1') {
          const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
          if (confirmed) {
            delete notes[name];
            if (currentNote === name) {
              currentNote = 'Home';
              if (!notes[currentNote]) notes[currentNote] = '';
            }
            saveNotes();
            loadNote(currentNote);
          }
        }
      });

      noteList.appendChild(li);
    }
  });
}

function updateNoteList() {
  const query = (searchInput?.value || '').toLowerCase();
  renderFilteredNoteList(query);
}

function setTheme(mode) {
  if (mode === 'dark') {
    app.classList.add('dark-mode');
    app.classList.remove('light-mode');
    toggleThemeBtn.textContent = '☀️ Light Mode';
  } else {
    app.classList.remove('dark-mode');
    app.classList.add('light-mode');
    toggleThemeBtn.textContent = '🌙 Dark Mode';
  }
  localStorage.setItem('theme', mode);
  updateEditor(notes[currentNote]);
}

toggleThemeBtn.addEventListener('click', () => {
  const newMode = app.classList.contains('dark-mode') ? 'light' : 'dark';
  setTheme(newMode);
});

newNoteBtn.addEventListener('click', () => {
  const name = prompt('New note name:');
  if (!name) return;
  if (notes[name]) return alert('Note already exists.');
  notes[name] = '';
  loadNote(name);
});

searchInput.addEventListener('input', () => {
  updateNoteList();
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    const name = prompt('New note name:');
    if (!name) return;
    if (notes[name]) return alert('Note already exists.');
    notes[name] = '';
    loadNote(name);
  }

  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

const storedTheme = localStorage.getItem('theme') || 'light';
setTheme(storedTheme);
loadNote(currentNote);

