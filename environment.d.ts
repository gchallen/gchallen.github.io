declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_JEED_SERVER: string
      NEXT_PUBLIC_PLAYGROUND_SERVER: string
      NEXT_PUBLIC_GOOGLE_ANALYTICS: string
      NEXT_PUBLIC_SHOW_DRAFTS?: boolean
      NEXT_PUBLIC_SHOW_OPENING?: boolean
    }
  }
}
export {}
