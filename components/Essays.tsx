import Link from "next/link"
import { Essay } from "../lib/getEssays"
import SubscribeButton from "./SubscribeButton"

const Summary: React.FC<{ essay: Essay }> = ({ essay }) => {
  const { title, description, publishedAt, url } = essay
  return (
    <div>
      <h3>
        <Link href={`/${url}`}>
          <a>
            {publishedAt ? `${publishedAt} : ` : ""}
            {title}
          </a>
        </Link>
      </h3>
      <p>{description}</p>
    </div>
  )
}
const Essays: React.FC<{ published: Essay[]; drafts?: Essay[]; h1?: boolean; showSubscribe?: boolean }> = ({
  published,
  drafts,
  h1 = false,
  showSubscribe = false,
}) => {
  return (
    <>
      {published.length > 0 && (
        <>
          {h1 ? (
            <h1>Essays</h1>
          ) : (
            <Link href="/essays/">
              <a className="inverted-link">
                <h2>Essays</h2>
              </a>
            </Link>
          )}
          <p>
            I post essays here on teaching, technology, and the overlap between the two. I try to keep my essays on
            teaching accessible to teachers who don&apos;t program, and my essays on technology interesting to
            programmers who don&apos;t teach.
          </p>
          {showSubscribe && (
            <SubscribeButton hideAfterSubscribe>
              <p>Want to know when I post new essays? Subscribe here.</p>
            </SubscribeButton>
          )}
          {drafts && drafts.length > 0 && (
            <>
              {h1 ? <h2>Drafts</h2> : <h3>Drafts</h3>}
              {drafts.map((essay, i) => (
                <Summary key={i} essay={essay} />
              ))}
            </>
          )}
          {published.slice(0, 5).map((essay, i) => (
            <Summary key={i} essay={essay} />
          ))}
        </>
      )}
    </>
  )
}
export default Essays
