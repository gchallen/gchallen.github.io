import { GetStaticProps } from "next"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import ChooseDarkMode from "../components/ChooseDarkMode"
import Essays from "../components/Essays"
import Footer from "../components/Footer"
import { Essay, getEssays } from "../lib/getEssays"
import styles from "../styles/index.module.scss"

const Page: React.FC<{ drafts: Essay[]; published: Essay[] }> = ({ drafts, published }) => {
  const description =
    "Hi, I'm Geoff Challen. I love to teach, and I love to code. I teach students to code. " +
    "And I write code that helps them learn."
  return (
    <div className={styles.index}>
      <Head>
        <title>Geoffrey Challen : Teaching Faculty</title>
        <meta property="og:title" content="Geoffrey Challen, Teaching Faculty" key="ogtitle" />
        <meta name="description" content={description.trim()} />
        <meta property="og:description" content={description.trim()} key="ogdesc" />
      </Head>
      <div className={styles.container}>
        <Image
          src="/cartoon-130x176.png"
          alt="Geoffrey Challen"
          width={130}
          height={176}
          priority
          unoptimized={process.env.NODE_ENV === "development"}
        />
        <nav className={`${styles.nav} responsive`}>
          <div>
            <Link href="/essays">Essays</Link>
          </div>
          <div>
            <Link href="/projects">Projects</Link>
          </div>
          <div>
            <Link href="/about">About</Link>
          </div>
          <div>
            <Link href="/chat">Chat</Link>
          </div>
          <div>
            <Link href="/CV">CV</Link>
          </div>
          {process.env.NEXT_PUBLIC_SHOW_OPENING && (
            <div>
              <Link href="/opening">Recruiting</Link>
            </div>
          )}
          <div>
            <ChooseDarkMode />
          </div>
        </nav>
      </div>
      <div className="responsive" style={{ marginTop: -32 }}>
        <h1>Hi, I&apos;m Geoff</h1>
        <p className={styles.h2}>
          I love to teach, and I love to code. <br />I teach students to code. <br />
          And I write code that helps them learn.
        </p>
        <p>
          My goal is to teach computer science to as many people as possible. I do this by creating interactive learning
          environments that scale. You can explore an example of my materials at{" "}
          <Link href="https://learncs.online" target="_blank">
            learncs.online
          </Link>
          .
        </p>
        <p>
          Here&apos;s a <Link href="/about">long bio</Link>, or perhaps you&apos;d prefer something{" "}
          <Link href="/bio">shorter</Link>.
        </p>
        <hr style={{ marginTop: 0 }} />
        <Essays published={published} limit random showSubscribe />
      </div>
      <Footer />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { published, drafts } = await getEssays()
  return { props: { published } }
}

export default Page
