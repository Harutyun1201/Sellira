# Sellira

**Sellira** is a minimalist, markdown-based note-taking app built with vanilla JavaScript, HTML, and CSS. It offers local-first storage, hybrid Markdown editing (one line at a time), note linking, graph visualization, theme switching, and a clean offline experience—without any backend or authentication.

---

![Sellira Welcome Page](/Images/Sellira_Welcome_Page.png)

## 🚀 Features

- **Multi-note Management**  
  Create, rename, and delete notes with real-time UI updates.

- **Search Functionality**  
  Filter notes by title using the search input; focus it quickly with a shortcut.

- **Hybrid Markdown Editing**  
  Only one line is editable at a time. All others are rendered using Markdown via `marked` and `contenteditable`.

- **Bidirectional Note Linking**  
  Use `[[Note Name]]` syntax to link to or create notes across your note graph.

- **Graph View**  
  Visualize the network of your linked notes in a minimalist graph panel.  
  Click any node to instantly open the note it represents. Updates live as you edit.

- **Offline Access and Privacy**  
  Everything is stored locally using `localStorage` — no servers or accounts.

- **Minimalist Interface**  
  Simple, distraction-free UI with light/dark theme toggle.

- **Autosave and Edit Handling**  
  Notes are saved automatically during editing and persist across reloads.

---

## 📁 Project Structure

```

Sellira/
├── index.html
├── src/
│   ├── main.js
│   └── style.css
├── Images/
│   └── Sellira\_Welcome\_Page.png
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
└── .gitignore

````

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harutyun1201/Sellira.git
cd Sellira
````

### 2. Install dependencies

```bash
npm install
```

### 3. Run in Development Mode

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build for Production

To generate an optimized production build:

```bash
npm run build
```

The output will be placed in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

> ⚠️ Do not open `dist/index.html` directly with `file://` — use a local server or the preview command.

---

## ⌨️ Keyboard Shortcuts

* `Ctrl + Alt + N` — Create new note
* `Ctrl + /` — Focus on the search bar
* `Enter` — Insert new editable line
* `Backspace` — Merge line with the one above if at the beginning

---

## 🛠️ Built With

* [Marked](https://github.com/markedjs/marked) – Lightweight Markdown parser
* [D3.js](https://d3js.org/) – Data-driven documents for the graph view
* [Vite](https://vitejs.dev/) – Development and build tool
* Vanilla JavaScript, HTML5, CSS3

---

## 🧾 License

This project is licensed under the **MIT License**. See the [LICENSE](/LICENSE) file for details.

---

## 👤 Author

**Harutyun Grigoryan**
