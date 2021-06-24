import Link from "next/link"
import styles from "./Index.module.scss"

const Index: React.FC = () => {
  return (
    <div className={styles.index}>
      <img src="/cartoon-light.png" alt="Geoffrey Challen" width={88} height={102} />
      <div className="responsive">
        <h1>Hi, I&apos;m Geoff</h1>
        <p className={styles.h2}>
          I love to teach, and I love to code. <br />I teach students to code. <br />
          And I write code that helps them learn.
        </p>
        <p>
          My goal is to teach as many students as possible. I do this by creating interactive learning
          environments that scale.
        </p>
        <p>
          I post essays here on teaching, technology, and the overlap between the two. I try to keep my essays on
          teaching accessible to teachers who don&apos;t program, and my essays on technology interesting to programmers
          who don&apos;t teach.
        </p>
        <p>
          <Link href="/about">More about me...</Link>
        </p>
        <hr />
      </div>
    </div>
  )
}

export default Index
