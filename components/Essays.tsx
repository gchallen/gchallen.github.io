import Link from "next/link"
import { Essay } from "../lib/getEssays"

const Essays: React.FC<{ published: Essay[]; drafts?: Essay[]; h1?: boolean }> = ({ published, h1 = false }) => {
  return (
    <>
      {published.length > 0 && (
        <>
          {h1 ? (
            <h2 className="h1">Essays</h2>
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
          {published.slice(0, 5).map(({ title, description, publishedAt, url }, i) => (
            <div key={i}>
              <h3>
                <Link href={`/${url}`}>
                  <a>
                    {publishedAt} : {title}
                  </a>
                </Link>
              </h3>
              <p>{description}</p>
            </div>
          ))}
        </>
      )}
    </>
  )
}
export default Essays
