import { RunPythonRequest, RunPythonResponse } from "../types/runpython"
import { PyodideInterface, loadPyodide } from "pyodide"

/*
const loadPyodide = new Promise<ReturnType<typeof _loadPyodide>>(async (resolve) => {
  resolve(_loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" }))
})
*/

const stdout: string[] = []

let pyodide: PyodideInterface
Promise.resolve().then(async () => {
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" })
  pyodide.setStdout({ batched: (line) => stdout.push(line) })
})

addEventListener(
  "message",
  async (event) => {
    if (!pyodide) {
      return RunPythonResponse.check({ error: "pyodide not loaded" })
    }
    const request = RunPythonRequest.check(event.data)

    stdout.length = 0
    await pyodide.runPythonAsync(request.code)
    const result = stdout.join("\n")
    stdout.length = 0

    event.ports[0].postMessage(RunPythonResponse.check({ result }))
  },
  false,
)
