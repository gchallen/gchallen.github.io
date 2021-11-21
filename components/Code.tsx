import type { Ace as AceType } from "ace-builds"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-hook-inview"

const Ace = dynamic(() => import("react-ace"), { ssr: false })

const Code: React.FC<{ originalCode: string; mode: string; children: string }> = ({ mode, children, ...props }) => {
  const code = useMemo(() => Buffer.from(props.originalCode, "base64").toString(), [props.originalCode])

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

  const ace = state !== "static" && (
    <Ace
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
      onLoad={(setEditor) => {
        editor.current = setEditor
        setState("loaded")
      }}
    />
  )

  return (
    <>
      <div
        ref={ref}
        className="ace_editor ace-ssr"
        dangerouslySetInnerHTML={{ __html: children }}
        style={{ display: state !== "loaded" ? "block" : "none" }}
      />
      {ace && ace}
    </>
  )
}

export default Code
