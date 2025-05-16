import { EditorView, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

export function createEditor(parent, content, isDark, onChange) {
  const extensions = [
    highlightActiveLine(),
    drawSelection(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
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

