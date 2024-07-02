import Head from "next/head"
import NextImage from "next/image"
import Link from "next/link"
import { PropsWithChildren } from "react"
import { onlyText } from "react-children-utilities"
import { usePopperTooltip } from "react-popper-tooltip"
import "react-popper-tooltip/dist/styles.css"
import Code from "../components/Code"
import Footer from "../components/Footer"
import Header from "../components/Header"
import YouTube from "../components/YouTube"
import SubscribeButton from "../components/SubscribeButton"

const Footnote: React.FC<PropsWithChildren & { counter: string }> = ({ counter, children }) => {
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
    },
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

const A: React.FC<PropsWithChildren & { href: string }> = ({ href, ...props }) => {
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
    return <Link href={href} {...props} />
  }
}

const Image: React.FC<
  PropsWithChildren & { src: string; alt: string; width: number; height: number; caption?: string }
> = ({ src, alt, width, height, children, ...props }) => {
  return (
    <figure>
      <NextImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized={process.env.NODE_ENV === "development"}
        style={{ height: "auto" }}
        {...props}
      />
      <figcaption>{children}</figcaption>
    </figure>
  )
}

const ScreenOnly: React.FC<PropsWithChildren> = ({ children }) => <div className="screenonly">{children}</div>
const PrintOnly: React.FC<PropsWithChildren> = ({ children }) => <div className="printonly">{children}</div>
const Comment: React.FC = () => null

const Wrapper: React.FC<
  PropsWithChildren & {
    frontmatter: {
      title: string
      description: string
      publishedAt: string
      reading: { text: string }
      isEssay: boolean
      draft?: boolean
      noDate?: boolean
      noTitle?: boolean
      technical?: boolean
    }
  }
> = ({ frontmatter, children }) => {
  const { title, description, technical, publishedAt, reading, noDate, noTitle, isEssay, draft } = frontmatter
  const actualTitle = `Geoffrey Challen : ${title}`
  return (
    <>
      <Head>
        <title>{actualTitle}</title>
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
                <strong>{!draft ? publishedAt : "Draft"}</strong>
                <br />
                <em>{reading.text}</em>
              </div>
            )}
          </div>
        )}
        {isEssay && (
          <div className="opening">
            I&apos;m recruiting a Ph.D. student.{" "}
            <a href="/opening" target="_blank">
              Find out more here.
            </a>
          </div>
        )}
        {children}
      </main>
      {isEssay && (
        <div id="thanks" className="responsive">
          <p className="thanks">
            Thanks for reading! I&apos;d love to hear your take. Feel free to{" "}
            <a href="mailto:geoffrey.challen@gmail.com">get in touch</a> if you have questions or comments.
          </p>
          <SubscribeButton hideAfterSubscribe>
            <span>Subscribe here to be notified when I post new essays:</span>
          </SubscribeButton>
        </div>
      )}
      <Footer />
    </>
  )
}
const components = { wrapper: Wrapper, a: A, Code, Footnote, Image, ScreenOnly, PrintOnly, Comment, YouTube }
export default components
