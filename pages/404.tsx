import Head from "next/head"
import Image from "next/image"
import Link from "next/link"

const PageNotFound: React.FC = () => {
  return (
    <>
      <Head>
        <title>Page Not Found : Geoffrey Challen</title>
        <meta name="description" content="Page not found" />
      </Head>
      <div
        className="responsive"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Image
          src="/cartoon-130x176.png"
          alt="Geoffrey Challen"
          width={130}
          height={176}
          priority
          unoptimized={process.env.NODE_ENV === "development"}
        />
        <h1>Page Not Found</h1>
        <p>
          Sorry, I couldn&apos;t find that page. Use <Link href="/">this link</Link> to return to safety.
        </p>
      </div>
    </>
  )
}

export default PageNotFound
