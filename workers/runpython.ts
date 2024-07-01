import type { PyodideInterface, loadPyodide } from "pyodide"
import {
  LoadPyodideRequest,
  LoadPyodideResponse,
  RunPythonOptions,
  RunPythonRequest,
  RunPythonResponse,
  StartRunResponse,
} from "../types/runpython"

const PYODIDE_VERSION = "0.26.1"
const OUTPUT_LIMIT = 1024

importScripts(`https://cdn.jsdelivr.net/npm/pyodide@${PYODIDE_VERSION}/pyodide.min.js`)

let lineCount = 0
const stdout: string[] = []

declare global {
  interface Window {
    loadPyodide: typeof loadPyodide
  }
}

let pyodideLoader: Promise<PyodideInterface>

const startPyodide = async (): Promise<PyodideInterface> => {
  if (!pyodideLoader) {
    pyodideLoader = new Promise<PyodideInterface>(async (resolve, reject) => {
      try {
        console.debug("Loading Pyodide")
        const start = Date.now()

        const pyodide = await self.loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
          lockFileURL: "/pyodide-lock.json",
          packages: ["mypy", "pycodestyle", "typing-extensions", "mypy_extensions"],
          fullStdLib: false,
        })

        pyodide.setStdout({
          batched: (line) => {
            lineCount++
            if (lineCount <= OUTPUT_LIMIT) {
              stdout.push(line)
            } else if (lineCount === OUTPUT_LIMIT + 1) {
              stdout.push(`(Output truncated after ${OUTPUT_LIMIT} lines)`)
            }
          },
        })

        /*
        await pyodide.loadPackage("micropip")
        const micropip = pyodide.pyimport("micropip")
        await micropip.install("pycodestyle")
        await micropip.install("mypy")
        await micropip.install("typing-extensions")
        await micropip.install("mypy_extensions")
        console.log(micropip.freeze())

        console.log(`Pyodide packages installed in: ${Date.now() - start}ms`)

        console.log(`Pyodide warmed in: ${Date.now() - start}ms`)
        */

        console.debug(`Pyodide loaded (+${Date.now() - start}ms)`)

        // Warm
        await checkCode(`print("Hello, world!")`, {}, pyodide)
        await runCode(`print("Hello, world!")`, pyodide)

        console.debug(`Pyodide warmed (+${Date.now() - start}ms)`)

        resolve(pyodide)
      } catch (err) {
        reject(err)
      }
    })
  }
  return pyodideLoader
}

function clearStdout() {
  stdout.length = 0
  lineCount = 0
}

async function checkCode(
  code: string,
  options: RunPythonOptions,
  pyodide: PyodideInterface,
): Promise<RunPythonResponse | undefined> {
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
    const error = stdout.join("\n").replaceAll("stdin:", "Line ")
    return RunPythonResponse.check({ type: "runresponse", error })
  }

  clearStdout()

  if (!options.noMyPy) {
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
      const error = stdout.join("\n").replaceAll("/snippet.py:", "Line ")
      return RunPythonResponse.check({ type: "runresponse", error })
    }
  }

  return
}

async function runCode(code: string, pyodide: PyodideInterface): Promise<RunPythonResponse> {
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

  return RunPythonResponse.check({ type: "runresponse", result, error })
}

addEventListener(
  "message",
  async (event) => {
    const replyPort = event.ports[0]

    let pyodide: PyodideInterface | undefined = undefined
    try {
      pyodide = await startPyodide()
    } catch (err) {}

    if (LoadPyodideRequest.guard(event.data)) {
      replyPort.postMessage(LoadPyodideResponse.check({ type: "loadresponse", ok: !!pyodide }))
      return
    }

    if (!pyodide) {
      replyPort.postMessage(RunPythonResponse.check({ type: "runresponse", error: "Pyodide not loaded" }))
      return
    }

    const request = RunPythonRequest.check(event.data)

    const checkResponse = await checkCode(request.code, request.options ?? {}, pyodide!)
    if (checkResponse) {
      replyPort.postMessage(checkResponse)
    }

    replyPort.postMessage(StartRunResponse.check({ type: "startrun" }))

    const runResponse = await runCode(request.code, pyodide!)
    replyPort.postMessage(runResponse)
  },
  false,
)
