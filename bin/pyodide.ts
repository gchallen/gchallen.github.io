import fs from "fs/promises"
import { loadPyodide } from "pyodide"
import pyodidePackages from "../pyodide-packages.json"

Promise.resolve().then(async () => {
  const pyodide = await loadPyodide({
    fullStdLib: false,
    stdout: () => {},
    stderr: () => {},
  })

  const origLoadPackage = pyodide.loadPackage
  pyodide.loadPackage = function (pkgs, options) {
    return origLoadPackage(pkgs, { messageCallback: () => {}, errorCallback: () => {}, ...options })
  }

  await pyodide.loadPackage("micropip")
  const micropip = pyodide.pyimport("micropip")

  for (const pyodidePackage of pyodidePackages) {
    await micropip.install(pyodidePackage)
  }

  await fs.writeFile("public/pyodide-lock.json", micropip.freeze())
})
