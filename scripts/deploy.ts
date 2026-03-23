import { execSync } from "child_process"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { createInterface } from "readline/promises"

const ROOT = join(import.meta.dirname, "..")
const NAMESPACE = "geoffreychallen"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function exec(cmd: string, cwd: string = ROOT): void {
  execSync(cmd, { cwd, stdio: "pipe" })
}

async function step(label: string, fn: () => Promise<void> | void): Promise<void> {
  process.stdout.write(`● ${label}...`)
  try {
    await fn()
    process.stdout.write(`\r✓ ${label}\n`)
  } catch (e: unknown) {
    process.stdout.write(`\r✗ ${label}\n\n`)
    if (e && typeof e === "object" && "stderr" in e) {
      const shellErr = e as { stdout: Buffer; stderr: Buffer }
      const stderr = shellErr.stderr.toString().trim()
      const stdout = shellErr.stdout.toString().trim()
      if (stderr) console.error(stderr)
      if (stdout) console.error(stdout)
    } else if (e instanceof Error) {
      console.error(e.message)
    }
    process.exit(1)
  }
}

async function ask(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return /^[Yy]$/.test(answer.trim())
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------
const pkgPath = join(ROOT, "package.json")
const pkg = JSON.parse(await readFile(pkgPath, "utf-8"))
let version: string = pkg.version

function computeNextVersion(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const [verYear, verMonth, verMinor] = version.split(".").map(Number)

  if (verYear === year && verMonth === month) {
    return `${year}.${month}.${verMinor + 1}`
  }
  return `${year}.${month}.0`
}

async function bumpVersion(nextVersion: string): Promise<void> {
  const content = await readFile(pkgPath, "utf-8")
  await writeFile(pkgPath, content.replace(`"version": "${version}"`, `"version": "${nextVersion}"`))
  version = nextVersion
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
function runChecks(): void {
  exec("bun check")
}

function buildAndPushWww(): void {
  exec(
    `docker buildx build . --platform=linux/amd64,linux/arm64/v8 --tag geoffreychallen/www:latest --tag geoffreychallen/www:${version} --push`,
  )
}

function buildAndPushRag(): void {
  exec("bun build:vector")
  exec(
    `docker buildx build . --platform=linux/amd64,linux/arm64/v8 --tag geoffreychallen/rag-server:latest --tag geoffreychallen/rag-server:${version} --push`,
    join(ROOT, "rag"),
  )
}

function updateDeployments(): void {
  exec(
    `kubectl set image deployment/www-geoffreychallen-com-deployment www-geoffreychallen-com=geoffreychallen/www:${version} -n ${NAMESPACE}`,
  )
  exec(
    `kubectl set image deployment/rag-geoffreychallen-com-deployment rag-server=geoffreychallen/rag-server:${version} -n ${NAMESPACE}`,
  )
  exec(
    `kubectl rollout restart deployment/www-geoffreychallen-com-deployment deployment/rag-geoffreychallen-com-deployment -n ${NAMESPACE}`,
  )
  exec(
    `kubectl rollout status deployment/www-geoffreychallen-com-deployment deployment/rag-geoffreychallen-com-deployment -n ${NAMESPACE}`,
  )
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const nextVersion = computeNextVersion()
if (await ask(`Bump version ${version} → ${nextVersion}? [y/N] `)) {
  await bumpVersion(nextVersion)
  console.log(`Bumped to v${version}`)
}

console.log(`\nDeploying v${version}\n`)

await step("Running checks", runChecks)
await step("Building and pushing www", buildAndPushWww)
await step("Building and pushing rag-server", buildAndPushRag)
await step("Updating and waiting for deployments", updateDeployments)

console.log(`\nDeploy complete.`)
