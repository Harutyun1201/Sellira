import { marked } from 'marked';

const noteList = document.getElementById('noteList');
const noteTitle = document.getElementById('noteTitle');
const newNoteBtn = document.getElementById('newNote');
const toggleThemeBtn = document.getElementById('toggleTheme');
const searchInput = document.getElementById('searchInput');
const app = document.getElementById('app');
const contextMenu = document.getElementById('context-menu');
const editorContainer = document.getElementById('editor');

let notes = JSON.parse(localStorage.getItem('sellira-notes'));
let currentNote = localStorage.getItem('sellira-current');
let suppressEditorFocus = false;

if (!notes) {
  notes = {
    "Manual": `# 📘 Welcome to Sellira

Sellira is a minimalist, Markdown-based note-taking app. Here's how to get started:

## ✍️  Creating Notes
- Press **Ctrl + Alt + N** or click the **New Note** button.
- Name your note and start typing!

## ✏️ Renaming Notes
- Right-click the note title in the sidebar and select **Rename**.
- Enter the new name and press **Enter** to save.

## 🗑️ Deleting Notes
- Right-click the note title in the sidebar and select **Delete**.
- Confirm the deletion when prompted.

## 🔗 Linking Notes
- Use \`[[Note Name]]\` syntax to link the notes

## 🎨 Themes
- Toggle between light and dark mode using the \`☀️  Light Mode / 🌙 Dark Mode\` button.

## 🔍 Search
- Use **Ctrl + /** to focus the search bar and filter notes quickly.

## 📌 Tip
- Notes are saved automatically and stored in your browser (offline friendly).

**Think. Write. Link. ✨**`
  };
  currentNote = "Manual";
  localStorage.setItem('sellira-notes', JSON.stringify(notes));
  localStorage.setItem('sellira-current', currentNote);
}

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
  // 🧼 Blur anything currently focused (editable div, etc.)
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // 🧼 Clear selection to prevent old range issues
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();

  // 🧼 Clean empty placeholder
  if (!notes[name] || notes[name].trim() === '✍️  start typing...') {
    notes[name] = '';
  }

  currentNote = name;
  noteTitle.textContent = name;

  renderEditorLines(notes[name]);  // Render clean state
  updateNoteList();                // Update list if needed
  saveNotes();                     // Persist
}

function renderEditorLines(content) {
  content = content || '';
  // 🧼 Full reset of editor state
  editorContainer.innerHTML = '';
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
  }
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();

  const isEmpty = content.trim() === '';
  const lines = isEmpty ? [] : content.split('\n');

  
  
  
  if (Object.keys(notes).length === 0 || !currentNote || !(currentNote in notes)) {
    editorContainer.innerHTML = `
      <div class="editor-empty">
        📝 No notes found.<br/>
        Click <strong>“New Note”</strong> or press <strong>Ctrl + Alt + N</strong> to get started.
      </div>
    `;
    return;
  }

if (lines.length === 0) {
  const placeholderDiv = document.createElement('div');
  placeholderDiv.className = 'editor-line placeholder';
  placeholderDiv.dataset.line = 0;
  placeholderDiv.textContent = '✍️  start typing...';
  placeholderDiv.contentEditable = true;
// Prevent mouse clicks from moving caret
placeholderDiv.addEventListener('mousedown', (e) => {
  if (placeholderDiv.classList.contains('placeholder')) {
    e.preventDefault();
    // Keep focus at start
    setTimeout(() => {
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(placeholderDiv.firstChild, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }, 0);
  }
});

// Prevent arrow keys from moving cursor
placeholderDiv.addEventListener('keydown', (e) => {
  if (
    placeholderDiv.classList.contains('placeholder') &&
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)
  ) {
    e.preventDefault();
  }
});

  editorContainer.appendChild(placeholderDiv);
const enforceCursorLock = () => {
  const sel = window.getSelection();
  if (
    document.activeElement === placeholderDiv &&
    placeholderDiv.classList.contains('placeholder') &&
    sel.anchorNode === placeholderDiv &&
    sel.anchorOffset > 0
  ) {
    const range = document.createRange();
    range.setStart(placeholderDiv.firstChild, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

document.addEventListener('selectionchange', enforceCursorLock);

  // Focus and set cursor at start of text
  setTimeout(() => {
    if (!suppressEditorFocus) {
    placeholderDiv.focus();
    const range = document.createRange();
    range.setStart(placeholderDiv.firstChild, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    }
  }, 0);

  // On input, remove placeholder class and only the placeholder text
const clearPlaceholderOnInput = () => {
  if (!placeholderDiv.classList.contains('placeholder')) return;

  // Wait for the character to appear in the DOM
  setTimeout(() => {
    const typed = placeholderDiv.textContent.replace('✍️  start typing...', '').trim();

    if (!typed) return;

    // Save typed char and fully re-render in editable mode
    notes[currentNote] = typed;
    saveNotes();
    renderEditorLines(notes[currentNote]);

    // Immediately activate editing on line 0 with caret at end
    setTimeout(() => {
      activateLineEdit(0, { __caretOffset: typed.length });
    }, 0);
  }, 0);
};

  placeholderDiv.addEventListener('input', clearPlaceholderOnInput);

placeholderDiv.addEventListener('blur', () => {
  const value = placeholderDiv.textContent.trim();

  // If it's still the placeholder (class + content), re-render it as placeholder
  if (
    placeholderDiv.classList.contains('placeholder') ||
    value === '' ||
    value === '✍️  start typing...'
  ) {
    renderEditorLines('');
    return;
  }

  // Else, treat it as real content
  notes[currentNote] = value;
  saveNotes();
  renderEditorLines(notes[currentNote]);
});

  return;
}

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

  if (pendingEdit) {
    const { index, event } = pendingEdit;
    pendingEdit = null;
    setTimeout(() => activateLineEdit(index, event), 0);
  }

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
      let textNode = editableDiv.firstChild;

      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        textNode = document.createTextNode('');
        editableDiv.appendChild(textNode);
      }

      const offset = Math.min(clickEvent.__caretOffset, textNode.length);
      range.setStart(textNode, offset);
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

    // ✅ BACKSPACE at start
if (e.key === 'Backspace') {
  const text = editableDiv.textContent;
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const cursorPos = range.startOffset;
  const isAllSelected = selection.toString() === text;

  const updatedLines = notes[currentNote].split('\n');

  // ✅ Case 1: Full line selected or text becomes empty → delete line
  if ((text.trim() === '' || isAllSelected) && updatedLines.length > 1) {
    e.preventDefault();

    updatedLines.splice(index, 1); // remove this line
    notes[currentNote] = updatedLines.join('\n');
    saveNotes();

    skipBlur = true;
    editableDiv.onblur = null;
    editableDiv.remove();

    renderEditorLines(notes[currentNote]);

    // Focus previous or next line
    const newIndex = index > 0 ? index - 1 : 0;
    const newOffset = notes[currentNote].split('\n')[newIndex]?.length || 0;

    setTimeout(() => {
      activateLineEdit(newIndex, { __caretOffset: newOffset });
    }, 0);
    return;
  }

  // ✅ Case 2: Cursor at start → merge with previous line
  if (cursorPos === 0 && index > 0) {
    e.preventDefault();

    const currentLine = text;
    const previousLine = updatedLines[index - 1];

    const merged = previousLine + currentLine;
    const offsetAfterMerge = previousLine.length;

    updatedLines[index - 1] = merged;
    updatedLines.splice(index, 1);
    notes[currentNote] = updatedLines.join('\n');
    saveNotes();

    skipBlur = true;
    editableDiv.onblur = null;
    editableDiv.remove();

    renderEditorLines(notes[currentNote]);

    setTimeout(() => {
      activateLineEdit(index - 1, { __caretOffset: offsetAfterMerge });
    }, 0);
  }
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

if (e.ctrlKey && e.code === 'Slash') {
  e.preventDefault();
  suppressEditorFocus = true;

  setTimeout(() => {
    searchInput.focus();
    searchInput.select();

    // Clear the flag shortly after
    setTimeout(() => {
      suppressEditorFocus = false;
    }, 50);
  }, 0);
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
  const remainingNotes = Object.keys(notes).filter(n => n !== selectedNote);
  if (remainingNotes.length > 0) {
    currentNote = remainingNotes.includes("Manual") ? "Manual" : remainingNotes[0];
  } else {
    currentNote = '';
  }
}
    saveNotes();
    loadNote(currentNote);
    updateNoteList();
  }
  contextMenu.style.display = 'none';
});

window.addEventListener('beforeunload', () => {
  const editableLines = Array.from(editorContainer.querySelectorAll('.editor-line.editable'));
  const updatedLines = notes[currentNote].split('\n');

  editableLines.forEach(line => {
    const index = parseInt(line.dataset.line);
    const updatedText = line.textContent.trim();
    updatedLines[index] = updatedText;
  });

  const finalText = updatedLines.filter(line => line.trim() !== '').join('\n');
  notes[currentNote] = finalText;
  saveNotes();
});


// ✅ Load
const storedTheme = localStorage.getItem('theme') || 'light';
setTheme(storedTheme);
loadNote(currentNote);

