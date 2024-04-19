import { PyodideInterface, loadPyodide } from "pyodide"
import { RunPythonRequest, RunPythonResponse, StartRunResponse } from "../types/runpython"

let lineCount = 0
const stdout: string[] = []

let setPyodideLoaded: (value: unknown) => void
const pyodideLoaded = new Promise((resolve) => {
  setPyodideLoaded = resolve
})

let pyodide: PyodideInterface
let loaded = false
Promise.resolve().then(async () => {
  pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" })

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
  await micropip.install("mypy")
  await micropip.install("typing-extensions")
  await micropip.install("mypy_extensions")

  // Warm
  await checkCode(`print("Hello, world!")`)
  await runCode(`print("Hello, world!")`)

  setPyodideLoaded(true)
})

function clearStdout() {
  stdout.length = 0
  lineCount = 0
}

async function checkCode(code: string): Promise<RunPythonResponse | undefined> {
  const encodedCode = btoa(code)
  const errorCount = await pyodide.runPythonAsync(`
import pycodestyle
from base64 import b64decode
originalCode = b64decode("${encodedCode}").decode("utf-8")
pep8style = pycodestyle.StyleGuide()
count_errors = pep8style.input_file('stdin', lines=originalCode.splitlines(True), expected=["E302", "E305", "W292"])
count_errors
`)
  if (errorCount > 0) {
    return RunPythonResponse.check({ type: "response", error: stdout.join("\n") })
  }

  clearStdout()

  pyodide.FS.writeFile("/snippet.py", code, { encoding: "utf-8" })
  const mypyResult = await pyodide.runPythonAsync(`
import sys
from mypy import api

result = api.run(["--strict", "--pretty", "/snippet.py"])
if result[0]:
    print(result[0])
if result[1]:
    print(result[1])
result[2]
`)

  if (mypyResult != 0) {
    return RunPythonResponse.check({ type: "response", error: stdout.join("\n") })
  }

  return
}

async function runCode(code: string): Promise<RunPythonResponse> {
  clearStdout()

  let result: string | undefined
  let error: unknown | undefined

  try {
    await pyodide.runPythonAsync(code)
    result = stdout.join("\n")
  } catch (_error) {
    error = _error
  }

  clearStdout()

  return RunPythonResponse.check({ type: "response", result, error })
}

addEventListener(
  "message",
  async (event) => {
    const replyPort = event.ports[0]
    await pyodideLoaded

    const request = RunPythonRequest.check(event.data)

    const checkResponse = await checkCode(request.code)
    if (checkResponse) {
      replyPort.postMessage(checkResponse)
    }

    replyPort.postMessage(StartRunResponse.check({ type: "startrun" }))

    const runResponse = await runCode(request.code)
    replyPort.postMessage(runResponse)
  },
  false,
)
