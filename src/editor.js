import { EditorView, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

export function createEditor(parent, content, isDark, onChange) {
  // Remove Ctrl+/ (Mod-/) from defaultKeymap to avoid conflict with global search shortcut
  const filteredKeymap = defaultKeymap.filter(binding => {
    return !(binding.key === "Mod-/" || binding.mac === "Cmd-/");
  });

  const extensions = [
    highlightActiveLine(),
    drawSelection(),
    history(),
    keymap.of([
      indentWithTab,       // Enable Tab to insert indentation
      ...filteredKeymap,   // Default keys excluding Ctrl+/
      ...historyKeymap
    ]),
    markdown(),
    EditorView.updateListener.of((v) => {
      if (v.docChanged) {
        onChange(v.state.doc.toString());
      }
    }),
    ...(isDark ? [oneDark] : [])
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

