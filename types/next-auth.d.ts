import "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken: any
    error: any
  }
}
