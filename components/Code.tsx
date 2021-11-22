import { terminalOutput } from "@cs124/jeed-output"
import { useJeed } from "@cs124/jeed-react"
import { Request, Response, Task, TaskArguments } from "@cs124/jeed-types"
import { usePlayground } from "@cs124/playground-react"
import { Result, Submission } from "@cs124/playground-types"
import type { Ace as AceType } from "ace-builds"
import capitalize from "capitalize"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-hook-inview"
import { FaPlayCircle, FaTimes } from "react-icons/fa"

const Ace = dynamic(() => import("react-ace"), { ssr: false })

const RunButton: React.FC<{ size: number; onClick: () => void }> = ({ size, onClick }) => {
  return (
    <div onClick={onClick} style={{ position: "relative", width: size, height: size }}>
      <FaPlayCircle style={{ position: "absolute", width: size - 4, height: size - 4, top: 2, left: 2 }} />
    </div>
  )
}

const DEFAULT_FILES = {
  python: "main.py",
} as Record<string, string>

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

  const { run: runJeed } = useJeed()
  const { run: runPlayground } = usePlayground()
  const [blank, setBlank] = useState(false)
  const [running, setRunning] = useState(false)
  const runningTimer = useRef<ReturnType<typeof setTimeout>>()
  const [outputOpen, setOutputOpen] = useState(false)

  const [height, setHeight] = useState(0)
  const [state, setState] = useState<"static" | "loading" | "loaded">("static")
  const ref = useRef<HTMLDivElement>(null)
  const editor = useRef<AceType.Editor>()

  const onEnter = useCallback(() => {
    setState("loading")
  }, [])

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
  }, [state])

  useEffect(() => {
    if (state === "static" && ref.current) {
      ref.current.style.display = "block"
    }
  }, [state])

  let runWithJeed = ["java", "kotlin"].includes(mode)
  let runWithPlayground = ["python"].includes(mode)

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
        }, 200)
        setOutputOpen(true)
        const response = await runJeed(request, true)
        setResponse({ response })
      } catch (error: any) {
        setResponse({ error })
      } finally {
        runningTimer.current && clearTimeout(runningTimer.current)
        setBlank(false)
        setRunning(false)
      }
    },
    [mode, runJeed]
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
      }, 200)
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

  const output = useMemo(() => {
    if (running) {
      return { output: "Running..." }
    } else if (blank) {
      return { output: "" }
    } else if (runWithJeed) {
      return response?.response
        ? terminalOutput(response.response)
        : response?.error
        ? { output: response?.error, level: "error" }
        : undefined
    } else if (runWithPlayground) {
      return result?.error
        ? { output: result?.error, level: "error" }
        : { output: result?.result?.outputLines.map(({ line }) => line).join("\n") || "" }
    }
  }, [running, blank, response, result])

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
        exec: () => (runWithJeed ? jeed("run") : runWithPlayground ? playground() : () => {}),
        readOnly: true,
      },
      {
        name: "close",
        bindKey: { win: "Esc", mac: "Esc" },
        exec: () => setOutputOpen(false),
        readOnly: true,
      },
    ]
  }, [runWithJeed, runWithPlayground, jeed, playground, setOutputOpen])

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
        readOnly={!runWithJeed}
        name={`ace-${codeId}`}
        className={"ace-ssr"}
        mode={mode}
        width="100%"
        height={`${height}px`}
        maxLines={Infinity}
        fontSize="1rem"
        showPrintMargin={false}
        defaultValue={code}
        onBeforeLoad={(ace) => {
          ace.config.set("basePath", `https://cdn.jsdelivr.net/npm/ace-builds@${ace.version}/src-min-noconflict`)
        }}
        style={{ display: state === "loaded" ? "block" : "none" }}
        commands={commands}
        onLoad={(setEditor) => {
          editor.current = setEditor
          setState("loaded")
        }}
      />
      {(runWithJeed || runWithPlayground) && (
        <div style={{ position: "absolute", bottom: 0, right: 0 }}>
          <RunButton
            size={32}
            onClick={() => (runWithJeed ? jeed("run") : runWithPlayground ? playground() : undefined)}
          />
        </div>
      )}
    </>
  )

  return (
    <div className="ace-frame">
      <div style={{ position: "relative", paddingBottom: runWithJeed ? 32 : 8 }}>
        <div
          ref={ref}
          className="ace_editor ace-ssr"
          dangerouslySetInnerHTML={{ __html: children }}
          style={{ display: state !== "loaded" ? "block" : "none" }}
        />
        {ace && ace}
      </div>
      <div className="language-label">{capitalize(mode)}</div>
      {output !== undefined && outputOpen && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, color: "#888888" }}>
            <FaTimes onClick={() => setOutputOpen(false)} />
          </div>
          <div className="output">
            <span className={output.level}>{output.output}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Code
