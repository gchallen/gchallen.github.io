import { GetStaticProps } from "next"
import Head from "next/head"
import Essays from "../components/Essays"
import Footer from "../components/Footer"
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
        <title>Geoffrey Challen : Essays</title>
        <meta property="og:title" content="Essays" key="ogtitle" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} key="ogdesc" />
      </Head>
      <Header />
      <div className="responsive paddings">
        <Essays published={published} drafts={drafts} h1 showSubscribe />
      </div>
      <Footer />
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { published, drafts } = await getEssays()
  return { props: { published, drafts: process.env.NEXT_PUBLIC_SHOW_DRAFTS ? drafts : [] } }
}

export default Page
