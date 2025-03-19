import { terminalOutput } from "@cs124/jeed-output"
import { useJeed } from "@cs124/jeed-react"
import { Request, Response, Task, TaskArguments } from "@cs124/jeed-types"
import { usePlayground } from "@cs124/playground-react"
import { Result, Submission } from "@cs124/playground-types"
import type { Ace as AceType } from "ace-builds"
import capitalize from "capitalize"
import Color from "color"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-hook-inview"
import { FaPlayCircle, FaTimes } from "react-icons/fa"
import styled from "styled-components"
import { RunPythonOptions } from "../types/runpython"
import { useRunPython } from "./RunPython"

const Ace = dynamic(() => import("react-ace"), { ssr: false })

const RunButton: React.FC<{ size: number; onClick: () => void }> = ({ size, onClick }) => {
  return (
    <div onClick={onClick} style={{ position: "relative", width: size, height: size, zIndex: 1000 }}>
      <FaPlayCircle style={{ position: "absolute", width: size - 4, height: size - 4, top: 2, left: 2 }} />
    </div>
  )
}

const DEFAULT_FILES = {
  python: "main.py",
  java: "Main.java",
} as Record<string, string>

const AceFrame = styled.div`
  position: relative;
  border: 1px solid lightgrey;
  padding-top: 8px;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: #fefefe;

  .dark-mode & {
    border: 1px solid #222222;
    background-color: #222222;
  }
`

const LanguageLabel = styled.div`
  position: absolute;
  right: 4px;
  top: 0;
  border-top-right-radius: 8px;
  background-color: transparent;
  font-size: 0.5em;
  font-family: "Monaco", monospace;
  user-select: none;
`

const Output = styled.div<{ $state?: string }>`
  white-space: pre-wrap;
  min-height: calc(1.5em + 16px);
  font-family: Monaco, monospace;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  background-color: #222222;
  .dark-mode & {
    background-color: #444444;
  }
  font-size: 0.8em;
  color: #dddddd;
  padding: 8px;
  max-height: calc(30em + 16px);
  overflow: scroll;
  color: ${(props) => (props.$state === "error" ? "red" : props.$state === "warning" ? "goldenrod" : "#dddddd")};
  .dark-mode & {
    color: ${(props) =>
      props.$state === "error"
        ? Color("red").lighten(0.2).hex()
        : props.$state === "warning"
          ? Color("goldenrod").lighten(0.2).hex()
          : "#dddddd"};
  }
`

const RUNNING_DELAY = 400

const Code: React.FC<{ codeId: string; originalCode: string; mode: string; meta: string; children: string }> = ({
  codeId,
  originalCode,
  mode,
  meta,
  children,
}) => {
  const code = useMemo(() => Buffer.from(originalCode, "base64").toString(), [originalCode])
  const [response, setResponse] = useState<{ response?: Response; error?: string } | undefined>()
  const [result, setResult] = useState<{ result?: Result; error?: string } | undefined>()
  const [pythonOutput, setPythonOutput] = useState<{ result?: string; error?: string } | undefined>()

  const { run: runJeed } = useJeed()
  const { run: runPlayground } = usePlayground()
  const { run: runPython, load: loadPyodide } = useRunPython()
  const [blank, setBlank] = useState(false)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const runningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [outputOpen, setOutputOpen] = useState(false)

  const [height, setHeight] = useState(0)
  const [state, setState] = useState<"static" | "loading" | "loaded">("static")
  const ref = useRef<HTMLDivElement>(null)
  const editor = useRef<AceType.Editor | null>(null)

  const onEnter = useCallback(async () => {
    setState("loading")
    setLoading(true)
    try {
      await loadPyodide()
    } finally {
      setLoading(false)
    }
  }, [loadPyodide])

  const [setRef, _] = useInView({
    threshold: 0,
    unobserveOnEnter: true,
    onEnter,
  })

  useEffect(() => {
    if (state === "static") {
      setRef(ref.current)
      setHeight(ref.current?.clientHeight ?? 0)
    }
  }, [state, setRef])

  useEffect(() => {
    if (state === "static" && ref.current) {
      ref.current.style.display = "block"
    }
  }, [state])

  const runWithJeed =
    ["java", "kotlin"].includes(mode) && (!meta || (!meta.includes("norun") && !meta.includes("slow")))
  const runWithPython = ["python"].includes(mode)
  const runWithPlayground = ["java"].includes(mode) && meta && meta.includes("slow")

  let snippet = meta === undefined || !meta.includes("source")

  const jeed = useCallback(
    async (job: "run" | "lint" | "complexity" | "features") => {
      if (!editor.current) {
        return
      }
      const content = editor.current.getValue()
      if (content.trim() === "") {
        setResponse(undefined)
        return
      }
      let tasks: Task[]
      let args: TaskArguments = { snippet: { indent: 2 } }
      if (job === "run") {
        tasks = mode === "java" ? ["compile", "execute"] : ["kompile", "execute"]
      } else if (job === "lint") {
        tasks = mode === "java" ? ["checkstyle"] : ["ktlint"]
      } else if (job === "complexity") {
        tasks = ["complexity"]
      } else if (job === "features") {
        if (mode !== "java") {
          throw Error("features not yet supported for Kotlin")
        }
        tasks = ["features"]
      } else {
        throw Error(mode)
      }
      if (tasks.includes("checkstyle")) {
        args.snippet!.indent = 2
        args.checkstyle = { failOnError: true }
      }
      if (tasks.includes("ktlint")) {
        args.ktlint = { failOnError: true }
      }
      if (mode === "kotlin") {
        args.snippet!.fileType = "KOTLIN"
      }
      const request: Request = {
        label: "demo",
        tasks,
        ...(snippet && { snippet: content }),
        ...(!snippet && { sources: [{ path: `Example.${mode === "java" ? "java" : "kt"}`, contents: content }] }),
        arguments: args,
      }
      try {
        setBlank(true)
        runningTimer.current = setTimeout(() => {
          setRunning(true)
        }, RUNNING_DELAY)
        setOutputOpen(true)
        const response = await runJeed(request, true)
        setResponse({ response })
      } catch (error: any) {
        setResponse({ error: error.toString() })
      } finally {
        runningTimer.current && clearTimeout(runningTimer.current)
        setBlank(false)
        setRunning(false)
      }
    },
    [mode, runJeed, snippet],
  )

  const playground = useCallback(async () => {
    if (!editor.current) {
      return
    }
    const content = editor.current.getValue()
    if (content.trim() === "") {
      setResult(undefined)
      return
    }

    let path = DEFAULT_FILES[mode]

    const submission: Submission = {
      image: `cs124/playground-runner-${mode}`,
      filesystem: [{ path, contents: content }],
      timeout: 8000,
    }
    try {
      setBlank(true)
      runningTimer.current = setTimeout(() => {
        setRunning(true)
      }, RUNNING_DELAY)
      setOutputOpen(true)
      const result = await runPlayground(submission, true)
      if (result.timedOut) {
        setResult({ error: "Timeout" })
      } else {
        setResult({ result })
      }
    } catch (error: any) {
      setResult({ error: error.toString() })
    } finally {
      runningTimer.current && clearTimeout(runningTimer.current)
      setBlank(false)
      setRunning(false)
    }
  }, [mode, runPlayground])

  const python = useCallback(async () => {
    if (!editor.current) {
      return
    }
    const content = editor.current.getValue()
    if (content.trim() === "") {
      setResult(undefined)
      return
    }

    try {
      setBlank(true)

      let showedLoading = false
      loadingTimer.current = setTimeout(() => {
        setOutputOpen(true)
        setLoading(true)
        showedLoading = true
      }, RUNNING_DELAY)

      const loaded = await loadPyodide()
      if (!loaded) {
        setPythonOutput({ error: "Unable to load Pyodide" })
      }
      loadingTimer.current && clearTimeout(loadingTimer.current)

      runningTimer.current = setTimeout(
        () => {
          setOutputOpen(true)
          setRunning(true)
        },
        showedLoading ? 0 : RUNNING_DELAY,
      )

      const options = RunPythonOptions.check({
        noMyPy: meta?.includes("noMyPy"),
      })
      const result = await runPython(content, options)
      setOutputOpen(true)
      setPythonOutput({ result })
    } catch (error: any) {
      setOutputOpen(true)
      setPythonOutput({ error: error.toString() })
    } finally {
      loadingTimer.current && clearTimeout(loadingTimer.current)
      runningTimer.current && clearTimeout(runningTimer.current)
      setBlank(false)
      setLoading(false)
      setRunning(false)
    }
  }, [runPython, loadPyodide, meta])

  const output = useMemo(() => {
    if (runWithPython && loading) {
      return { output: "Loading Pyodide..." }
    } else if (running) {
      return { output: "Running..." }
    } else if (blank) {
      return { output: "" }
    } else if (runWithJeed) {
      return response?.response
        ? terminalOutput(response.response)
        : response?.error
          ? { output: response?.error, level: "error" }
          : undefined
    } else if (runWithPython) {
      let pythonConsoleOutput = pythonOutput?.result || ""
      if (pythonConsoleOutput.trim() === "") {
        pythonConsoleOutput = "(No output)"
      }
      return pythonOutput?.error ? { output: pythonOutput?.error, level: "error" } : { output: pythonConsoleOutput }
    } else if (runWithPlayground) {
      return result?.error
        ? { output: result?.error, level: "error" }
        : { output: result?.result?.outputLines.map(({ line }) => line).join("\n") || "" }
    }
  }, [running, loading, blank, response, result, pythonOutput, runWithJeed, runWithPlayground, runWithPython])

  const commands = useMemo(() => {
    return [
      {
        name: "gotoline",
        exec: (): boolean => {
          return false
        },
        bindKey: { win: "", mac: "" },
      },
      {
        name: "run",
        bindKey: { win: "Ctrl-Enter", mac: "Ctrl-Enter" },
        exec: () =>
          runWithJeed ? jeed("run") : runWithPython ? python() : runWithPlayground ? playground() : () => {},
        readOnly: true,
      },
      {
        name: "close",
        bindKey: { win: "Esc", mac: "Esc" },
        exec: () => setOutputOpen(false),
        readOnly: true,
      },
    ]
  }, [runWithJeed, runWithPlayground, runWithPython, jeed, playground, python, setOutputOpen])

  useEffect(() => {
    commands.forEach((command) => {
      if (!editor.current) {
        return
      }
      editor.current?.commands.addCommand(command)
    })
  }, [commands])

  const ace = state !== "static" && (
    <>
      <Ace
        readOnly={!runWithJeed && !runWithPython}
        name={`ace-${codeId}`}
        className={"ace-ssr"}
        mode={mode}
        width="100%"
        height={`${height}px`}
        maxLines={Infinity}
        fontSize="1rem"
        showPrintMargin={false}
        highlightActiveLine={runWithJeed}
        defaultValue={code}
        onBeforeLoad={(ace) => {
          ace.config.set("basePath", `https://cdn.jsdelivr.net/npm/ace-builds@${ace.version}/src-min-noconflict`)
          ace.config.set("modePath", `https://cdn.jsdelivr.net/npm/ace-builds@${ace.version}/src-min-noconflict`)
          ace.config.set("themePath", `https://cdn.jsdelivr.net/npm/ace-builds@${ace.version}/src-min-noconflict`)
        }}
        style={{ display: state === "loaded" ? "block" : "none" }}
        commands={commands}
        onLoad={(setEditor) => {
          editor.current = setEditor
          setEditor.moveCursorTo(0, 0)
          setState("loaded")
        }}
      />
      {(runWithJeed || runWithPlayground || runWithPython) && (
        <div style={{ position: "absolute", bottom: 0, right: 0 }}>
          <RunButton
            size={32}
            onClick={() =>
              runWithJeed ? jeed("run") : runWithPython ? python() : runWithPlayground ? playground() : undefined
            }
          />
        </div>
      )}
    </>
  )

  return (
    <AceFrame>
      <div style={{ position: "relative", paddingBottom: runWithJeed || runWithPython || runWithPlayground ? 32 : 8 }}>
        <div
          ref={ref}
          className="ace_editor ace-ssr"
          dangerouslySetInnerHTML={{ __html: children }}
          style={{ display: state !== "loaded" ? "block" : "none" }}
        />
        {ace && ace}
      </div>
      <LanguageLabel>{mode === "sh" ? "sh" : capitalize(mode)}</LanguageLabel>
      {output !== undefined && outputOpen && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, color: "#888888" }}>
            <FaTimes onClick={() => setOutputOpen(false)} />
          </div>
          <Output $state={output.level}>{output.output}</Output>
        </div>
      )}
    </AceFrame>
  )
}

export default Code
