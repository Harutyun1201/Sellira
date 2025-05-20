import { marked } from 'marked';

const noteList = document.getElementById('noteList');
const noteTitle = document.getElementById('noteTitle');
const newNoteBtn = document.getElementById('newNote');
const toggleThemeBtn = document.getElementById('toggleTheme');
const searchInput = document.getElementById('searchInput');
const app = document.getElementById('app');
const contextMenu = document.getElementById('context-menu');
const editorContainer = document.getElementById('editor');

let notes = JSON.parse(localStorage.getItem('sellira-notes')) || {};
let currentNote = localStorage.getItem('sellira-current') || 'Home';
let selectedNote = null;
let pendingEdit = null;

marked.use({
  extensions: [{
    name: 'wikilink',
    level: 'inline',
    start(src) {
      return src.match(/\[\[/)?.index;
    },
    tokenizer(src) {
      const match = /^\[\[([^\]]+)\]\]/.exec(src);
      if (match) {
        return {
          type: 'wikilink',
          raw: match[0],
          text: match[1],
          tokens: [],
        };
      }
    },
    renderer(token) {
      const name = token.text;
      return `<a href="#" class="wikilink" data-target="${name}">${name}</a>`;
    }
  }]
});

function saveNotes() {
  localStorage.setItem('sellira-notes', JSON.stringify(notes));
  localStorage.setItem('sellira-current', currentNote);
}

function loadNote(name) {
  if (!notes[name] || notes[name].trim() === '✍️ start typing...') notes[name] = '';
  currentNote = name;
  noteTitle.textContent = name;
  renderEditorLines(notes[name]);
  updateNoteList();
  saveNotes();
}

function renderEditorLines(content) {
  editorContainer.innerHTML = '';
  const isEmpty = content.trim() === '';
  const lines = isEmpty ? [] : content.split('\n');

  // ✅ Show placeholder if note is empty
  if (lines.length === 0) {
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'editor-line placeholder';
    placeholderDiv.dataset.line = 0;
    placeholderDiv.textContent = '✍️ start typing...';
    placeholderDiv.contentEditable = true;

    placeholderDiv.addEventListener('mousedown', (e) => {
      e.preventDefault();
      placeholderDiv.textContent = '';
      placeholderDiv.classList.remove('placeholder');
      placeholderDiv.classList.add('editable');

      // ✅ Immediately convert to real editor line
      setTimeout(() => {
        activateLineEdit(0, e);
      }, 0);
    });

    placeholderDiv.addEventListener('blur', () => {
      const value = placeholderDiv.textContent.trim();
      if (value === '' || value === '✍️ start typing...') {
        renderEditorLines('');
      } else {
        notes[currentNote] = value;
        saveNotes();
        renderEditorLines(notes[currentNote]);
      }
    });

    editorContainer.appendChild(placeholderDiv);
    return;
  }

  // ✅ Render all non-empty lines
  lines.forEach((line, index) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'editor-line';
    lineDiv.dataset.line = index;
    lineDiv.innerHTML = marked.parse(line || '');

    lineDiv.addEventListener('mousedown', (e) => {
      const anchor = e.target.closest('a');
      if (anchor) {
        if (!anchor.classList.contains('wikilink')) {
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
          anchor.setAttribute(
            'href',
            anchor.getAttribute('href').startsWith('http')
              ? anchor.getAttribute('href')
              : 'https://' + anchor.getAttribute('href')
          );
        }
        return;
      }

      e.preventDefault();

      const currentEditable = editorContainer.querySelector('[contenteditable="true"]');
      if (currentEditable) {
        const editedIndex = parseInt(currentEditable.dataset.line);
        const updatedText = currentEditable.textContent;
        const updatedLines = notes[currentNote].split('\n');
        updatedLines[editedIndex] = updatedText;
        notes[currentNote] = updatedLines.join('\n');
        saveNotes();
        pendingEdit = { index, event: e };
        renderEditorLines(notes[currentNote]);
      } else {
        activateLineEdit(index, e);
      }
    });

    editorContainer.appendChild(lineDiv);
  });

  // ✅ Reapply pending edit if any
  if (pendingEdit) {
    const { index, event } = pendingEdit;
    pendingEdit = null;
    setTimeout(() => activateLineEdit(index, event), 0);
  }

  // ✅ Enable navigation for wikilinks
  editorContainer.querySelectorAll('a.wikilink').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const target = e.target.dataset.target;
      if (Object.prototype.hasOwnProperty.call(notes, target)) {
        loadNote(target);
      } else {
        const create = confirm(`Note "${target}" does not exist. Create it?`);
        if (create) {
          notes[target] = '';
          saveNotes();
          loadNote(target);
        }
      }
    });
  });
}

function activateLineEdit(index, clickEvent) {
  const original = notes[currentNote].split('\n')[index] || '';
  const lineDivs = editorContainer.querySelectorAll('.editor-line');
  const oldDiv = lineDivs[index];

  const editableDiv = document.createElement('div');
  editableDiv.className = 'editor-line editable';
  editableDiv.dataset.line = index;
  editableDiv.contentEditable = true;
  editableDiv.textContent = original;

  editorContainer.replaceChild(editableDiv, oldDiv);

  let skipBlur = false;

  setTimeout(() => {
    const sel = window.getSelection();
    const range = document.createRange();

    if (clickEvent.__caretOffset != null) {
      const textNode = editableDiv.firstChild;
      const offset = Math.min(clickEvent.__caretOffset, textNode?.length || 0);

      if (textNode) {
        range.setStart(textNode, offset);
      } else {
        range.setStart(editableDiv, 0); // fallback for empty line
      }
    } else {
      const offset = getCaretCharacterOffsetFromPoint(clickEvent, editableDiv);
      range.setStart(editableDiv.firstChild || editableDiv, offset);
    }

    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }, 0);

  editableDiv.addEventListener('keydown', (e) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const cursorPos = range.startOffset;

    // ✅ ENTER
    if (e.key === 'Enter') {
      e.preventDefault();

      const text = editableDiv.textContent;
      const before = text.slice(0, cursorPos);
      const after = text.slice(cursorPos);

      const updatedLines = notes[currentNote].split('\n');
      updatedLines[index] = before;
      updatedLines.splice(index + 1, 0, after);
      notes[currentNote] = updatedLines.join('\n');
      saveNotes();

      editableDiv.textContent = before;

      renderEditorLines(notes[currentNote]);
      setTimeout(() => {
        activateLineEdit(index + 1, { clientX: 0, clientY: 0 });
      }, 0);
    }

    // ✅ BACKSPACE at start of line (no skipping empty lines)
    if (e.key === 'Backspace' && cursorPos === 0 && index > 0) {
      e.preventDefault();

      const updatedLines = notes[currentNote].split('\n');
      const updatedText = editableDiv.textContent;
      updatedLines[index] = updatedText;

      const currentLine = updatedLines[index];
      const previousLine = updatedLines[index - 1];

      const offsetAfterMerge = previousLine.length || 0;

      updatedLines[index - 1] = previousLine + currentLine;
      updatedLines.splice(index, 1);
      notes[currentNote] = updatedLines.join('\n');
      saveNotes();

      skipBlur = true;
      editableDiv.onblur = null;
      editableDiv.remove();

      renderEditorLines(notes[currentNote]);

      setTimeout(() => {
        const allLines = notes[currentNote].split('\n');
        const targetLine = index - 1;
        const offset = allLines[targetLine]?.length || 0;
        activateLineEdit(targetLine, { __caretOffset: offset });
      }, 0);
    }
  });

  editableDiv.addEventListener('blur', () => {
    if (skipBlur) return;

    const updatedText = editableDiv.textContent;
    const updatedLines = notes[currentNote].split('\n');
    updatedLines[index] = updatedText;
    notes[currentNote] = updatedLines.join('\n');
    saveNotes();
    renderEditorLines(notes[currentNote]);
  });
}

function getCaretCharacterOffsetFromPoint(event, element) {
  let range, offset = 0;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (range && range.startContainer === element.firstChild && range.startOffset != null) {
      offset = range.startOffset;
    }
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (pos && pos.offset != null) {
      offset = pos.offset;
    }
  }
  return offset;
}

function renderFilteredNoteList(query) {
  noteList.innerHTML = '';
  Object.keys(notes).forEach(name => {
    if (!query || name.toLowerCase().includes(query)) {
      const li = document.createElement('li');
      if (query) {
        const regex = new RegExp(`(${query})`, 'gi');
        li.innerHTML = name.replace(regex, '<mark>$1</mark>');
      } else {
        li.textContent = name;
      }

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
  renderEditorLines(notes[currentNote]);
}

toggleThemeBtn.addEventListener('click', () => {
  const newMode = app.classList.contains('dark-mode') ? 'light' : 'dark';
  setTheme(newMode);
});

// ✅ New Note
newNoteBtn.addEventListener('click', () => {
  const raw = prompt('New note name:');
  if (raw === null) return;
  const name = raw.trim();
  if (!name) {
    alert("Note name cannot be empty.");
    return;
  }

  if (Object.prototype.hasOwnProperty.call(notes, name)) {
    alert(`A note named "${name}" already exists.`);
    return;
  }

  notes[name] = '';
  saveNotes();
  loadNote(name);
});

// ✅ Ctrl + Alt + N
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    const raw = prompt('New note name:');
    if (raw === null) return;
    const name = raw.trim();
    if (!name) {
      alert("Note name cannot be empty.");
      return;
    }

    if (Object.prototype.hasOwnProperty.call(notes, name)) {
      alert(`A note named "${name}" already exists.`);
      return;
    }

    notes[name] = '';
    saveNotes();
    loadNote(name);
  }

  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

searchInput.addEventListener('input', () => {
  updateNoteList();
});

document.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('#noteList li')) {
    e.preventDefault();
    contextMenu.style.display = 'none';
  }
});

// ✅ Rename
document.getElementById("rename-note").addEventListener("click", () => {
  if (!selectedNote) return;

  const raw = prompt("Enter the new name for the note:", selectedNote);
  if (raw === null) {
    contextMenu.style.display = 'none';
    return;
  }

  const newName = raw.trim();
  if (!newName) {
    alert("Note name cannot be empty.");
    return;
  }

  if (newName === selectedNote) {
    contextMenu.style.display = 'none';
    return;
  }

  if (Object.prototype.hasOwnProperty.call(notes, newName)) {
    alert(`A note named "${newName}" already exists.`);
    return;
  }

  const content = notes[selectedNote];
  notes[newName] = content;
  delete notes[selectedNote];

  saveNotes();

  if (currentNote === selectedNote) {
    loadNote(newName);
  } else {
    updateNoteList();
  }

  selectedNote = null;
  contextMenu.style.display = 'none';
});

// ✅ Delete
document.getElementById("delete-note").addEventListener("click", () => {
  if (!selectedNote) return;
  const confirmed = confirm(`Are you sure you want to delete "${selectedNote}"?`);
  if (confirmed) {
    delete notes[selectedNote];
    if (currentNote === selectedNote) {
      currentNote = 'Home';
      if (!notes[currentNote]) notes[currentNote] = '';
    }
    saveNotes();
    loadNote(currentNote);
    updateNoteList();
  }
  contextMenu.style.display = 'none';
});

window.addEventListener('beforeunload', () => {
  const editable = editorContainer.querySelector('[contenteditable="true"]');
  if (editable) {
    const index = parseInt(editable.dataset.line);
    const updatedText = editable.textContent.trim();
    const updatedLines = notes[currentNote].split('\n');
    updatedLines[index] = updatedText;
    if (updatedText && updatedText !== '✍️ start typing...') {
    notes[currentNote] = updatedLines.join('\n');
    saveNotes();
  }
  }
});


// ✅ Load
const storedTheme = localStorage.getItem('theme') || 'light';
setTheme(storedTheme);
loadNote(currentNote);

