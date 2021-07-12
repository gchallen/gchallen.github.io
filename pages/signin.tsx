import { signIn, useSession } from "next-auth/client"
import { useEffect, useRef } from "react"

const SignIn: React.FC = () => {
  const [session, loading] = useSession()
  const tried = useRef(false)

  useEffect(() => {
    if (loading) {
      return
    }
    if (!session && !tried.current) {
      tried.current = true
      signIn("google")
    } else {
      window.opener?.postMessage("complete", window.location.origin)
    }
  }, [session, loading])
  return null
}

export default SignIn
