import { PyodideInterface, loadPyodide } from "pyodide"
import { RunPythonRequest, RunPythonResponse } from "../types/runpython"

let lineCount = 0
const stdout: string[] = []

let pyodide: PyodideInterface
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
  pyodide.setInterruptBuffer
})

addEventListener(
  "message",
  async (event) => {
    if (!pyodide) {
      return RunPythonResponse.check({ error: "pyodide not loaded" })
    }
    const request = RunPythonRequest.check(event.data)

    stdout.length = 0
    lineCount = 0

    let result: string | undefined
    let error: unknown | undefined

    try {
      await pyodide.runPythonAsync(request.code)
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
