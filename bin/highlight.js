require("ace-builds/src-noconflict/ace")
const highlighter = require("ace-builds/src-noconflict/ext-static_highlight")

function highlight(content, opts) {
  const Mode = opts.mode && require(`ace-builds/src-noconflict/mode-${opts.mode}`).Mode
  const { html, css } = highlighter.renderSync(content, Mode && new Mode(), {})
  return { html, css }
}
module.exports = { highlight }
