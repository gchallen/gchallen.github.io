import fs from "fs/promises"
import { loadPyodide } from "pyodide"
import packageJson from "../package.json"
import pyodidePackages from "../pyodide-packages.json"

const PYODIDE_VERSION = packageJson.devDependencies.pyodide
const CDN_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

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

  // Get the frozen lockfile and fix URLs for CDN packages
  const lockfileStr = micropip.freeze()
  const lockfile = JSON.parse(lockfileStr)

  // Add CDN URLs for packages that don't have full URLs
  for (const [name, pkg] of Object.entries(lockfile.packages) as [string, Record<string, unknown>][]) {
    const fileName = pkg.file_name as string
    // If file_name doesn't start with http, it's a CDN package - add the full URL
    if (fileName && !fileName.startsWith("http")) {
      pkg.file_name = CDN_BASE_URL + fileName
    }
  }

  await fs.writeFile("public/pyodide-lock.json", JSON.stringify(lockfile, null, 2))
  console.log(`Generated pyodide-lock.json with ${Object.keys(lockfile.packages).length} packages`)
})
