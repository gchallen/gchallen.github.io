import Head from "next/head"
import Footer from "../components/Footer"
import Header from "../components/Header"

const Unsubscribed: React.FC = () => {
  return (
    <>
      <Head>
        <title>Unsubscribed — Geoffrey Challen</title>
      </Head>
      <Header />
      <main className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1>You&apos;ve been unsubscribed</h1>
        <p>You won&apos;t receive any more email notifications. Sorry to see you go!</p>
      </main>
      <Footer />
    </>
  )
}
export default Unsubscribed
