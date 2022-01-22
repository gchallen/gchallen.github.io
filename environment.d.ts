declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL: string
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      NEXT_PUBLIC_GOOGLE_RECAPTCHA_KEY: string
      NEXT_PUBLIC_JEED_SERVER: string
      NEXT_PUBLIC_PLAYGROUND_SERVER: string
      NEXT_PUBLIC_GOOGLE_ANALYTICS: string
    }
  }
}
export {}
