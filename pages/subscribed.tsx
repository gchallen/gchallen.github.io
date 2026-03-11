import Head from "next/head"
import Footer from "../components/Footer"
import Header from "../components/Header"

const Subscribed: React.FC = () => {
  return (
    <>
      <Head>
        <title>Subscribed — Geoffrey Challen</title>
      </Head>
      <Header />
      <main className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1>You&apos;re subscribed!</h1>
        <p>Thanks for confirming your email. You&apos;ll receive a notification when I publish new essays.</p>
      </main>
      <Footer />
    </>
  )
}
export default Subscribed
