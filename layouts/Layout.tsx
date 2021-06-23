import Head from "next/head"
import Link from "next/link"
import { onlyText } from "react-children-utilities"
import Header from "../components/Header"

const A: React.FC<{ href: string }> = ({ href, ...props }) => {
  if (href === "-") {
    const text = onlyText(props.children)
    const capital = text[0]
    const rest = text.length > 1 && text.slice(1)

    return (
      <>
        <div style={{ float: "left", fontSize: "3em", paddingRight: 16, lineHeight: 1 }}>{text[0]}</div>
        {rest && <span style={{ fontVariant: "small-caps", letterSpacing: "1.5px" }}>{rest}</span>}
      </>
    )
  } else if (href === "+") {
    const text = onlyText(props.children)
    return (
      <>
        <div style={{ float: "right", fontSize: "2em", paddingLeft: 16, lineHeight: 1, maxWidth: 400 }}>{text}</div>
        <span>{text}</span>
      </>
    )
  } else {
    return <Link href={href} {...props} />
  }
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
const components = { wrapper: Wrapper, a: A }
export default components
