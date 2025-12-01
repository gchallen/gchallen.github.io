/* eslint-disable @next/next/no-html-link-for-pages */

import Head from "next/head"
import Image from "next/image"

const ServerError: React.FC = () => {
  return (
    <>
      <Head>
        <title>Server Error : Geoffrey Challen</title>
        <meta name="description" content="Server error" />
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
        <h1>Server Error</h1>
        <p>
          Oops! Sorry about that. Please try reloading the page, or use <a href="/">this link</a> to return to safety.
        </p>
      </div>
    </>
  )
}

export default ServerError
