import { PyodideInterface, loadPyodide } from "pyodide"
import { RunPythonRequest, RunPythonResponse } from "../types/runpython"

let lineCount = 0
const stdout: string[] = []

let pyodide: PyodideInterface
let loaded = false
Promise.resolve().then(async () => {
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" })

  pyodide.setStdout({
    batched: (line) => {
      lineCount++
      if (lineCount <= 1024) {
        stdout.push(line)
      } else if (lineCount === 1025) {
        stdout.push("(Output truncated)")
      }
    },
  })

  await pyodide.loadPackage("micropip")
  const micropip = pyodide.pyimport("micropip")
  await micropip.install("pycodestyle")
  loaded = true
})

addEventListener(
  "message",
  async (event) => {
    if (!pyodide || !loaded) {
      event.ports[0].postMessage(RunPythonResponse.check({ error: "pyodide not loaded" }))
      return
    }

    const request = RunPythonRequest.check(event.data)

    let code = request.code
    if (!code.endsWith("\n\n")) {
      code += "\n"
    }

    stdout.length = 0
    lineCount = 0

    const encodedCode = btoa(code)
    const errorCount = await pyodide.runPythonAsync(`
import pycodestyle
from base64 import b64decode
originalCode = b64decode("${encodedCode}").decode("utf-8")
pep8style = pycodestyle.StyleGuide()
count_errors = pep8style.input_file('stdin', lines=originalCode.splitlines(True), expected=["E302", "E305"])
count_errors
`)
    if (errorCount > 0) {
      event.ports[0].postMessage(RunPythonResponse.check({ error: stdout }))
    }

    stdout.length = 0
    lineCount = 0

    let result: string | undefined
    let error: unknown | undefined

    try {
      await pyodide.runPythonAsync(code)
      result = stdout.join("\n")
    } catch (_error) {
      error = _error
    }

    stdout.length = 0
    lineCount = 0

    event.ports[0].postMessage(RunPythonResponse.check({ result, error }))
  },
  false,
)
