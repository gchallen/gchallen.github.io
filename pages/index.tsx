import { GetStaticProps } from "next"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import ChooseDarkMode from "../components/ChooseDarkMode"
import Essays from "../components/Essays"
import Footer from "../components/Footer"
import SubscribeButton from "../components/SubscribeButton"
import { Essay, getEssays } from "../lib/getEssays"
import styles from "../styles/index.module.scss"
import LoginButton from "../components/LoginButton"

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
          layout="fixed"
          unoptimized={process.env.NODE_ENV === "development"}
        />
        <nav className={`${styles.nav} responsive`}>
          <div>
            <Link href="/essays">Essays</Link>
          </div>
          <div>
            <Link href="/about">About</Link>
          </div>
          <div>
            <Link href="/CV">CV</Link>
          </div>
          <div>
            <Link href="#feeds">Subscribe</Link>
          </div>
          <div>
            <ChooseDarkMode />
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
          My goal is to teach computer science to as many students as possible. I do this by creating interactive learning environments that
          scale. <Link href="/about">More about me...</Link>
        </p>
        <SubscribeButton hideAfterSubscribe>
          <p>Want to be notified when I post new content? Subscribe here.</p>
        </SubscribeButton>
        <hr />
        <Essays published={published} limit />
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
