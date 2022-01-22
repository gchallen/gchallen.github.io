import { signOut, useSession } from "next-auth/react"
import { useEffect, useRef } from "react"

const SignIn: React.FC = () => {
  const { data: session, status } = useSession()
  const tried = useRef(false)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    if (session && !tried.current) {
      tried.current = true
      signOut()
    } else {
      window.opener?.postMessage("complete", window.location.origin)
    }
  }, [session, status])
  return null
}

export default SignIn
