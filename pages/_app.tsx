// organize-imports-ignore
import type { AppProps } from "next/app"
import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect } from "react"
import "../styles/reset.css"
import "../styles/global.scss"
import "../styles/ace.scss"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import { SessionProvider } from "next-auth/react"
import { NewWindowLoginProvider } from "../components/LoginButton"
import { DarkModeProvider } from "../components/ChooseDarkMode"
import { JeedProvider } from "@cs124/jeed-react"
import { PlaygroundProvider } from "@cs124/playground-react"
import { Analytics } from "@vercel/analytics/react"
import RunPythonProvider from "../components/RunPython"
import { SubscribeButtonContextProvider } from "../components/SubscribeButton"

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS as string, {
        page_path: url,
      })
    }
    router.events.on("routeChangeComplete", handleRouteChange)
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events])

  return (
    <SessionProvider session={pageProps.session}>
      <SubscribeButtonContextProvider>
        <NewWindowLoginProvider>
          <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_KEY}>
            <DarkModeProvider>
              <JeedProvider server={process.env.NEXT_PUBLIC_JEED_SERVER as string}>
                <PlaygroundProvider server={process.env.NEXT_PUBLIC_PLAYGROUND_SERVER as string}>
                  <RunPythonProvider>
                    <Head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <meta charSet="utf-8" />
                      <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon.png" />
                      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                      <link rel="manifest" href="/site.webmanifest" />
                      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
                      <meta name="msapplication-TileColor" content="#2d89ef" />
                      <meta name="theme-color" content="#ffffff" />
                    </Head>
                    <Component {...pageProps} />
                  </RunPythonProvider>
                  <Analytics />
                </PlaygroundProvider>
              </JeedProvider>
            </DarkModeProvider>
          </GoogleReCaptchaProvider>
        </NewWindowLoginProvider>
      </SubscribeButtonContextProvider>
    </SessionProvider>
  )
}
