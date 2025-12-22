import Link from "next/link"
import { Talk } from "../lib/getTalks"

const Summary: React.FC<{ talk: Talk }> = ({ talk }) => {
  const { title, description, publishedAt, url } = talk
  return (
    <div>
      <h3>
        <Link href={`/${url}`}>
          {publishedAt}: {title}
        </Link>
      </h3>
      <p>{description}</p>
    </div>
  )
}

const Talks: React.FC<{
  talks: Talk[]
  h1?: boolean
}> = ({ talks, h1 = false }) => {
  return (
    <>
      {talks.length > 0 && (
        <>
          {h1 ? (
            <div id="titleContainer">
              <h1>Talks</h1>
            </div>
          ) : (
            <Link href="/talks/" className="inverted-link">
              <h2>Talks</h2>
            </Link>
          )}
          {h1 ? (
            <>
              <div className="lead">
                <p>Presentations and talks on teaching, technology, and computer science education.</p>
              </div>
              <p>
                Each talk includes slides and a conversational summary generated from the audio recording. These
                summaries capture the discussion in a readable format for those who couldn&apos;t attend.
              </p>
            </>
          ) : (
            <p>
              Presentations and talks on teaching, technology, and computer science education. Each includes slides and
              a conversational summary.
            </p>
          )}
          {talks.map((talk, i) => (
            <Summary key={i} talk={talk} />
          ))}
        </>
      )}
    </>
  )
}

export default Talks
