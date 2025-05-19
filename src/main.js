import { createEditor } from './editor.js';

const noteList = document.getElementById('noteList');
const noteTitle = document.getElementById('noteTitle');
const newNoteBtn = document.getElementById('newNote');
const toggleThemeBtn = document.getElementById('toggleTheme');
const searchInput = document.getElementById('searchInput');
const app = document.getElementById('app');
const contextMenu = document.getElementById('context-menu');

let notes = JSON.parse(localStorage.getItem('sellira-notes')) || {};
let currentNote = localStorage.getItem('sellira-current') || 'Home';
let selectedNote = null;
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
      li.textContent = name;
      if (name === currentNote) li.classList.add('active');
      li.onclick = () => loadNote(name);

      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        selectedNote = name;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.display = 'block';
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

// ✅ New Note with validation
newNoteBtn.addEventListener('click', () => {
  const name = prompt('New note name:')?.trim();
  if (!name) {
    alert("Note name cannot be empty.");
    return;
  }

  if (notes[name]) {
    alert(`A note named "${name}" already exists.`);
    return;
  }

  notes[name] = '';
  loadNote(name);
});

searchInput.addEventListener('input', () => {
  updateNoteList();
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    const name = prompt('New note name:')?.trim();
    if (!name) {
      alert("Note name cannot be empty.");
      return;
    }
    if (notes[name]) {
      alert(`A note named "${name}" already exists.`);
      return;
    }
    notes[name] = '';
    loadNote(name);
  }

  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// Hide context menu when clicking elsewhere
document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

// Prevent global right-click unless on note
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('#noteList li')) {
    e.preventDefault();
    contextMenu.style.display = 'none';
  }
});

// ✅ Rename note with validation
document.getElementById("rename-note").addEventListener("click", () => {
  if (!selectedNote) return;

  const newName = prompt("Enter the new name for the note:", selectedNote)?.trim();
  if (!newName) {
    alert("Note name cannot be empty.");
    return;
  }

  if (newName === selectedNote) {
    contextMenu.style.display = 'none';
    return;
  }

  if (notes[newName]) {
    alert(`A note named "${newName}" already exists.`);
    return;
  }

  const content = notes[selectedNote];
  notes[newName] = content;
  delete notes[selectedNote];

  if (currentNote === selectedNote) {
    loadNote(newName);
  } else {
    updateNoteList();
  }

  selectedNote = null;
  saveNotes();
  contextMenu.style.display = 'none';
});

// ✅ Delete note
document.getElementById("delete-note").addEventListener("click", () => {
  if (!selectedNote) return;
  const confirmed = confirm(`Are you sure you want to delete "${selectedNote}"?`);
  if (confirmed) {
    delete notes[selectedNote];
    if (currentNote === selectedNote) {
      currentNote = 'Home';
      if (!notes[currentNote]) notes[currentNote] = '';
    }
    selectedNote = null;
    saveNotes();
    loadNote(currentNote);
    updateNoteList();
  }
  contextMenu.style.display = 'none';
});

const storedTheme = localStorage.getItem('theme') || 'light';
setTheme(storedTheme);
loadNote(currentNote);

