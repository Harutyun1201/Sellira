import { EditorView, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// ✅ Matched light theme — visually aligned with oneDark
const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff",
    color: "#000000",
    height: "100%",
    fontSize: "13px",
    fontFamily: "monospace"
  },
  ".cm-content": {
    fontFamily: "monospace" // ✅ No extra padding
  },
  ".cm-line": {
    lineHeight: "1.6",
  },
  ".cm-gutters": {
    backgroundColor: "#ffffff",
    color: "#aaa",
    border: "none"
  }
}, { dark: false });

// ✅ Utility to safely define highlight styles
function buildSafeHighlight(rules) {
  return HighlightStyle.define(
    rules.filter(rule => rule.tag && typeof rule.tag.id !== 'undefined')
  );
}

// ✅ Shared highlight logic
const baseHighlightRules = [
  { tag: tags.heading, fontSize: '1.25em', fontWeight: 'bold', color: '#333' },
  { tag: tags.strong, fontWeight: 'bold', color: '#000' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#444' },
  { tag: tags.link, color: '#0066cc', textDecoration: 'underline' },
  { tag: tags.quote, fontStyle: 'italic', color: '#555' },
  { tag: tags.list, color: '#333' },
  { tag: tags.code, backgroundColor: '#f6f8fa', color: '#d6336c', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }
];

const darkOverrides = {
  heading: '#cdd6f4',
  strong: '#ffffff',
  emphasis: '#cccccc',
  link: '#89b4fa',
  quote: '#a6adc8',
  list: '#bac2de',
  code: '#fab387'
};

const lightHighlight = buildSafeHighlight(baseHighlightRules);
const darkHighlight = buildSafeHighlight(
  baseHighlightRules.map(rule => {
    const tagName = Object.keys(tags).find(key => tags[key] === rule.tag);
    const override = tagName && darkOverrides[tagName];
    return override ? { ...rule, color: override } : rule;
  })
);

// ✅ Tab key: inserts 2 spaces at cursor
const insertTab = {
  key: "Tab",
  run: ({ state, dispatch }) => {
    const changes = state.changeByRange(range => ({
      changes: { from: range.from, to: range.to, insert: "  " },
      range: EditorSelection.cursor(range.from + 2)
    }));
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  }
};

// ✅ Shift+Tab: removes 2 spaces before cursor
const removeTab = {
  key: "Shift-Tab",
  run: ({ state, dispatch }) => {
    const changes = state.changeByRange(range => {
      const from = range.from;
      const before = state.doc.sliceString(from - 2, from);
      if (before === "  ") {
        return {
          changes: { from: from - 2, to: from },
          range: EditorSelection.cursor(from - 2)
        };
      }
      return { range };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "delete.backward" }));
    return true;
  }
};

export function createEditor(parent, content, isDark, onChange) {
  const filteredKeymap = defaultKeymap.filter(binding => {
    return !(binding.key === "Mod-/" || binding.mac === "Cmd-/");
  });

  const extensions = [
    highlightActiveLine(),
    drawSelection(),
    history(),
    keymap.of([
      insertTab,
      removeTab,
      ...filteredKeymap,
      ...historyKeymap
    ]),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.updateListener.of((v) => {
      if (v.docChanged) {
        onChange(v.state.doc.toString());
      }
    }),
    ...(isDark
      ? [syntaxHighlighting(darkHighlight)]
      : [lightTheme, syntaxHighlighting(lightHighlight)])
  ];

  const state = EditorState.create({
    doc: content,
    extensions
  });

  return new EditorView({
    state,
    parent
  });
}

