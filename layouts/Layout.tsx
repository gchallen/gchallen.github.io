import dynamic from "next/dynamic"
import Head from "next/head"
import NextImage from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { onlyText } from "react-children-utilities"
import { useInView } from "react-hook-inview"
import { usePopperTooltip } from "react-popper-tooltip"
import "react-popper-tooltip/dist/styles.css"
import Footer from "../components/Footer"
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
  const { getArrowProps, getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip(
    {
      placement: "top",
      delayHide: 100,
      interactive: true,
    },
    {
      modifiers: [
        {
          name: "flip",
          options: {
            padding: 90,
          },
        },
      ],
    }
  )

  return (
    <>
      <sup className="footnote" ref={setTriggerRef}>
        (<span className="inner">{counter}</span>)
      </sup>
      {visible && (
        <span ref={setTooltipRef} {...getTooltipProps({ className: "tooltip-container responsive" })}>
          <span>{children}</span>
          <span {...getArrowProps({ className: "tooltip-arrow" })} />
        </span>
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

const ScreenOnly: React.FC = ({ children }) => <div className="screenonly">{children}</div>
const PrintOnly: React.FC = ({ children }) => <div className="printonly">{children}</div>

const Wrapper: React.FC<{
  frontmatter: {
    title: string
    description: string
    publishedAt: string
    reading: { text: string }
    noDate?: boolean
    noTitle?: boolean
    technical?: boolean
  }
}> = ({ frontmatter, children }) => {
  const { title, description, technical, publishedAt, reading, noDate, noTitle } = frontmatter
  return (
    <>
      <Head>
        <title>Geoffrey Challen : {title}</title>
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
        {!noTitle && (
          <div id="titleContainer">
            <div style={{ flex: 1 }}>
              <h1>{title}</h1>
              {technical && <span className="technical">(Technical)</span>}
            </div>
            {!noDate && (
              <div id="publishedAt">
                <strong>{publishedAt || "Draft"}</strong>
                <br />
                <em>{reading.text}</em>
              </div>
            )}
          </div>
        )}
        {children}
      </main>
      {!noDate && (
        <div className="thanks">
          Thanks for reading!
          <br />
          I&apos;d love to know what you think.
          <br />
          Feel free to <a href="mailto:geoffrey.challen@gmail.com">get in touch.</a>
        </div>
      )}
      <Footer />
    </>
  )
}
const components = { wrapper: Wrapper, a: A, Code, Footnote, Image, ScreenOnly, PrintOnly }
export default components
