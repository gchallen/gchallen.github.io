import "ace-builds/src-noconflict/ace"
import highlighter from "ace-builds/src-noconflict/ext-static_highlight"
import { Mode as Java } from "ace-builds/src-noconflict/mode-java"
import { Mode as Kotlin } from "ace-builds/src-noconflict/mode-kotlin"
import { Mode as Python } from "ace-builds/src-noconflict/mode-python"
import { Mode as Sh } from "ace-builds/src-noconflict/mode-sh"

const modes = {
  java: Java,
  kotlin: Kotlin,
  python: Python,
  sh: Sh,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function highlight(content: string, opts: any) {
  const Mode = opts.mode ? modes[opts.mode] : undefined
  if (opts.mode && opts.mode !== "text" && !Mode) {
    throw Error(`Unloaded mode: ${opts.mode}`)
  }
  const { html, css } = highlighter.renderSync(content, Mode && new Mode(), {})
  return { html, css }
}
