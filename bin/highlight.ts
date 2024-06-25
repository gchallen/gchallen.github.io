import "ace-builds/src-noconflict/ace"
import highlighter from "ace-builds/src-noconflict/ext-static_highlight"

export async function highlight(content: string, opts: any) {
  const Mode = opts.mode && (await import(`ace-builds/src-noconflict/mode-${opts.mode}`)).Mode
  const { html, css } = highlighter.renderSync(content, Mode && new Mode(), {})
  return { html, css }
}
