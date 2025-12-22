import { GetStaticProps } from "next"
import Head from "next/head"
import Footer from "../components/Footer"
import Header from "../components/Header"
import Talks from "../components/Talks"
import { getTalks, Talk } from "../lib/getTalks"

const Page: React.FC<{ talks: Talk[] }> = ({ talks }) => {
  const description =
    "Presentations and talks on teaching, technology, and computer science education. " +
    "Each talk includes slides and a conversational summary for those who couldn't attend."
  return (
    <>
      <Head>
        <title>Geoffrey Challen : Talks</title>
        <meta property="og:title" content="Talks" key="ogtitle" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} key="ogdesc" />
      </Head>
      <Header />
      <div className="responsive paddings">
        <Talks talks={talks} h1 />
      </div>
      <Footer />
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const talks = await getTalks()
  return { props: { talks } }
}

export default Page
