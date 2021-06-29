import dynamic from "next/dynamic"
import Head from "next/head"
import NextImage from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { onlyText } from "react-children-utilities"
import { useInView } from "react-hook-inview"
import { usePopperTooltip } from "react-popper-tooltip"
import "react-popper-tooltip/dist/styles.css"
import Header from "../components/Header"

const Ace = dynamic(() => import("react-ace"), { ssr: false })

const Code: React.FC<{ originalCode: string; mode: string; children: string }> = ({ mode, children, ...props }) => {
  const code = useMemo(() => Buffer.from(props.originalCode, "base64").toString(), [props.originalCode])

  const [height, setHeight] = useState(0)
  const [state, setState] = useState<"static" | "loading" | "loaded">("static")
  const ref = useRef<HTMLDivElement>(null)

  const onEnter = useCallback(() => {
    setState("loading")
  }, [])

  const [setRef, _] = useInView({
    threshold: 0,
    unobserveOnEnter: true,
    onEnter,
  })

  useEffect(() => {
    setRef(ref.current)
    setHeight(ref.current?.clientHeight ?? 0)
  }, [])

  const ace = state !== "static" && (
    <Ace
      mode={mode}
      width="100%"
      height={`${height}px`}
      fontSize="1rem"
      showPrintMargin={false}
      defaultValue={code}
      onBeforeLoad={(ace) => {
        ace.config.set("basePath", `https://cdn.jsdelivr.net/npm/ace-builds@${ace.version}/src-min-noconflict`)
      }}
      style={{ display: state === "loaded" ? "block" : "none" }}
      onLoad={() => {
        setState("loaded")
      }}
    />
  )

  return (
    <>
      <div
        ref={ref}
        className="ace_editor"
        dangerouslySetInnerHTML={{ __html: children }}
        style={{ display: state !== "loaded" ? "block" : "none" }}
      />
      {ace && ace}
    </>
  )
}

const Footnote: React.FC<{ counter: string }> = ({ counter, children }) => {
  const { getArrowProps, getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    placement: "top",
  })

  return (
    <>
      <sup className="footnote" ref={setTriggerRef}>
        (<span className="inner">{counter}</span>)
      </sup>
      {visible && (
        <div ref={setTooltipRef} {...getTooltipProps({ className: "tooltip-container responsive" })}>
          <span>{children}</span>
          <div {...getArrowProps({ className: "tooltip-arrow" })} />
        </div>
      )}
    </>
  )
}

const A: React.FC<{ href: string }> = ({ href, ...props }) => {
  if (href === "-") {
    const text = onlyText(props.children)
    const capital = text[0]
    const rest = text.length > 1 && text.slice(1)

    return (
      <>
        <span className="firstword">{capital}</span>
        {rest && <span className="restword">{rest}</span>}
      </>
    )
  } else {
    return (
      <Link href={href}>
        <a {...props} />
      </Link>
    )
  }
}

const Image: React.FC<{ src: string; alt: string; width: number; height: number; caption?: string }> = ({
  src,
  alt,
  width,
  height,
  children,
  ...props
}) => {
  return (
    <figure>
      <NextImage
        src={src}
        alt={alt}
        layout="responsive"
        width={width}
        height={height}
        unoptimized={process.env.NODE_ENV === "development"}
        {...props}
      />
      <figcaption>{children}</figcaption>
    </figure>
  )
}

const Wrapper: React.FC<{ frontmatter: { title: string; description: string } }> = ({ frontmatter, children }) => {
  const { title, description } = frontmatter
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="ogtitle" />
        {description && (
          <>
            <meta name="description" content={description.trim()} />
            <meta property="og:description" content={description.trim()} key="ogdesc" />
          </>
        )}
      </Head>
      <Header />
      <main className="responsive paddings">
        <h1>{frontmatter.title}</h1>
        {children}
      </main>
    </>
  )
}
const components = { wrapper: Wrapper, a: A, Code, Footnote, Image }
export default components
