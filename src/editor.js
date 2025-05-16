import { EditorView, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// ✅ Layout theme for light mode
const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#ffffff",
    color: "#000000",
    height: "100%",
  },
  ".cm-content": {
    fontFamily: "monospace",
    padding: "12px",
  },
  ".cm-line": {
    lineHeight: "1.6",
  },
}, { dark: false });

// ✅ Safe function to build a HighlightStyle only with defined tags
function buildSafeHighlight(rules) {
  return HighlightStyle.define(
    rules
      .filter(rule => rule.tag && typeof rule.tag.id !== 'undefined')
  );
}

// ✅ Styled highlight rules (same logic for both themes)
const baseHighlightRules = [
  { tag: tags.heading, fontSize: '1.25em', fontWeight: 'bold', color: '#333' },
  { tag: tags.strong, fontWeight: 'bold', color: '#000' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#444' },
  { tag: tags.link, color: '#0066cc', textDecoration: 'underline' },
  { tag: tags.quote, fontStyle: 'italic', color: '#555' },
  { tag: tags.list, color: '#333' },
  { tag: tags.code, backgroundColor: '#f6f8fa', color: '#d6336c', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }
];

// ✅ Color override for dark mode
const darkOverrides = {
  heading: '#cdd6f4',
  strong: '#ffffff',
  emphasis: '#cccccc',
  link: '#89b4fa',
  quote: '#a6adc8',
  list: '#bac2de',
  code: '#fab387'
};

// ✅ Build highlight styles
const lightHighlight = buildSafeHighlight(baseHighlightRules);
const darkHighlight = buildSafeHighlight(
  baseHighlightRules.map(rule => {
    const tagName = Object.keys(tags).find(key => tags[key] === rule.tag);
    const override = tagName && darkOverrides[tagName];
    return override ? { ...rule, color: override } : rule;
  })
);

export function createEditor(parent, content, isDark, onChange) {
  const filteredKeymap = defaultKeymap.filter(binding => {
    return !(binding.key === "Mod-/" || binding.mac === "Cmd-/");
  });

  const extensions = [
    highlightActiveLine(),
    drawSelection(),
    history(),
    keymap.of([
      indentWithTab,
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

