import Link from "next/link"
import styles from "./Index.module.scss"

type Essay = {
  title: string
  description: string
  publishedAt: string
  url: string
}

const Index: React.FC<{ drafts: Essay[]; published: Essay[] }> = ({ drafts, published }) => {
  return (
    <div className={styles.index}>
      <div className={styles.container}>
        <img src="/cartoon-light.png" alt="Geoffrey Challen" width={88} height={102} />
        <nav className={styles.nav}>
          <div>
            <Link href="/essays">Essays</Link>
          </div>
          <div>
            <Link href="/about">About</Link>
          </div>
        </nav>
      </div>
      <div className="responsive">
        <h1>Hi, I&apos;m Geoff</h1>
        <p className={styles.h2}>
          I love to teach, and I love to code. <br />I teach students to code. <br />
          And I write code that helps them learn.
        </p>
        <p>
          My goal is to teach as many students as possible. I do this by creating interactive learning environments that
          scale.
        </p>
        <p>
          <Link href="/about">More about me...</Link>
        </p>
        <hr />
        {published.length > 0 && (
          <>
            <h2>Essays</h2>
            <p>
              I post essays here on teaching, technology, and the overlap between the two. I try to keep my essays on
              teaching accessible to teachers who don&apos;t program, and my essays on technology interesting to
              programmers who don&apos;t teach.
            </p>
            {published.slice(0, 5).map(({ title, description, publishedAt, url }, i) => (
              <div key={i}>
                <h3><Link href={`/${url}`}><a>{publishedAt} : {title}</a></Link></h3>
                <p>{description}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default Index
