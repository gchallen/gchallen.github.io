import { GetStaticProps } from "next"
import Head from "next/head"
import Essays from "../components/Essays"
import Header from "../components/Header"
import { Essay, getEssays } from "../lib/getEssays"

const Page: React.FC<{ drafts: Essay[]; published: Essay[] }> = ({ drafts, published }) => {
  const description =
    "I post essays here on teaching, technology, and the overlap between the two. " +
    "I try to keep my essays on teaching accessible to teachers who don't program, " +
    "and my essays on technology interesting to programmers who don't teach."
  return (
    <>
      <Head>
        <title>Essays</title>
        <meta property="og:title" content="Essays" key="ogtitle" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} key="ogdesc" />
      </Head>
      <Header />
      <div className="responsive paddings">
        <Essays published={published} h1 />
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { published, drafts } = await getEssays()
  return { props: { published } }
}

export default Page
