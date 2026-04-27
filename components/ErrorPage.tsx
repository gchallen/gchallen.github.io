/* eslint-disable @next/next/no-html-link-for-pages */

import Head from "next/head"
import Image from "next/image"
import { ReactNode } from "react"
import styles from "../styles/errorPage.module.scss"

interface ErrorPageProps {
  code: string
  title: string
  heading: string
  children: ReactNode
}

const ErrorPage: React.FC<ErrorPageProps> = ({ code, title, heading, children }) => {
  const [first, middle, ...rest] = code.split("")
  const last = rest.join("")
  return (
    <>
      <Head>
        <title>{title} : Geoffrey Challen</title>
        <meta name="description" content={title} />
      </Head>
      <div className={`${styles.container} responsive`}>
        <div className={styles.digits}>
          <span className={styles.digit}>{first}</span>
          <span className={styles.imageWrap}>
            <span className={styles.digit}>{middle}</span>
            <Image
              className={styles.image}
              src="/cartoon-130x176.png"
              alt="Geoffrey Challen"
              width={130}
              height={176}
              priority
              unoptimized={process.env.NODE_ENV === "development"}
            />
          </span>
          <span className={styles.digit}>{last}</span>
        </div>
        <div className={styles.message}>
          <h1>{heading}</h1>
          <p>
            {children} Use <a href="/">this link</a> to return to safety.
          </p>
        </div>
      </div>
    </>
  )
}

export default ErrorPage
