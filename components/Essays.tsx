import Link from "next/link"
import { useMemo, useState } from "react"
import { Essay } from "../lib/getEssays"
import { useNewWindowLogin } from "./LoginButton"
import SubscribeButton from "./SubscribeButton"

const Summary: React.FC<{ essay: Essay }> = ({ essay }) => {
  const { title, description, publishedAt, url } = essay
  return (
    <div>
      <h3>
        <Link href={`/${url}`}>
          {publishedAt ? `${publishedAt}: ` : ""}
          {title}
        </Link>
      </h3>
      <p>{description}</p>
    </div>
  )
}
const Essays: React.FC<{
  published: Essay[]
  drafts?: Essay[]
  h1?: boolean
  showSubscribe?: boolean
  limit?: boolean
  random?: boolean
}> = ({ published, drafts, h1 = false, showSubscribe = false, limit = false, random = false }) => {
  const { session } = useNewWindowLogin()
  const [randomIndex] = useState(() => Math.floor(Math.random() * 1000))

  const latestEssays = useMemo(() => {
    return published.slice(0, limit ? 4 : Infinity)
  }, [published, limit])

  const randomEssay = useMemo(() => {
    const notLatest = published.filter((e) => !latestEssays.map((p) => p.url).includes(e.url))
    return notLatest[randomIndex % notLatest.length]
  }, [published, latestEssays, randomIndex])

  return (
    <>
      {published.length > 0 && (
        <>
          {h1 ? (
            <div id="titleContainer">
              <h1>Essays</h1>
            </div>
          ) : (
            <Link href="/essays/" className="inverted-link">
              <h2>Essays</h2>
            </Link>
          )}
          {h1 ? (
            <>
              <div className="lead">
                <p>I post essays here on teaching, technology, and the overlap between the two.</p>
              </div>
              <p>
                I try to keep my essays on teaching accessible to teachers who don&apos;t program, and my essays on
                technology interesting to programmers who don&apos;t teach.{" "}
              </p>
            </>
          ) : (
            <p>
              I post essays here on teaching, technology, and the overlap between the two. I try to keep my essays on
              teaching accessible to teachers who don&apos;t program, and my essays on technology interesting to
              programmers who don&apos;t teach.{" "}
            </p>
          )}
          {limit && (
            <>
              {h1 ? <h2>Latest</h2> : <h3>Latest</h3>}
              <p>
                Here are my latest four essays. For the complete set, click <Link href="/essays/">here</Link>.
              </p>
            </>
          )}
          {drafts && drafts.length > 0 && <>{h1 ? <h2>Published</h2> : <h3>Published</h3>}</>}
          {latestEssays.map((essay, i) => (
            <Summary key={i} essay={essay} />
          ))}
          {drafts && drafts.length > 0 && session?.user?.email === "geoffrey.challen@gmail.com" && (
            <>
              {h1 ? <h2>Drafts</h2> : <h3>Drafts</h3>}
              {drafts.map((essay, i) => (
                <Summary key={i} essay={essay} />
              ))}
            </>
          )}
          {random && (
            <>
              {h1 ? <h2>Random Selection</h2> : <h3>Random Selection</h3>}
              <p>Here is a random selection from my archive. Enjoy!</p>
              <Summary essay={randomEssay} />
            </>
          )}
          {limit && (
            <p>
              For more essays, click <Link href="/essays/">here</Link>.
            </p>
          )}
          {showSubscribe && (
            <SubscribeButton hideAfterSubscribe>Want to know when I post new essays? Subscribe here:</SubscribeButton>
          )}
        </>
      )}
    </>
  )
}
export default Essays
