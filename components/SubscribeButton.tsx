import validator from "email-validator"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { FaCheckCircle } from "react-icons/fa"

const SubscribeButton: React.FC<{ hideAfterSubscribe?: boolean }> = ({ children, hideAfterSubscribe = false }) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [, setSubscriberCount] = useState<number | undefined>()
  const { data: session } = useSession()
  const [email, setEmail] = useState<string>("")
  const submitEmail = useRef<string>("")
  const [enabled, setEnabled] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hide, setHide] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetch("https://lists.geoffreychallen.com/publisher/")
      .then((res) => res.json())
      .then(({ count }) => {
        setSubscriberCount(count)
      })
      .catch(() => setHide(true))
    return () => {
      timer.current && clearTimeout(timer.current)
    }
  }, [])

  const updateEmail = useCallback((newEmail: string) => {
    setEmail(newEmail)
    setEnabled(validator.validate(newEmail))
    submitEmail.current = newEmail
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      updateEmail(session.user.email)
    } else {
      setShowSuccess(false)
      updateEmail("")
    }
  }, [session, updateEmail])

  const onChange = useCallback(
    (event) => {
      updateEmail(event.target.value)
    },
    [updateEmail]
  )

  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      if (!executeRecaptcha) {
        return
      }
      const token = await executeRecaptcha("subscribe")
      try {
        await fetch("https://lists.geoffreychallen.com/publisher/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: submitEmail.current }),
        })
      } catch (err) {}
      setShowSuccess(true)
      localStorage.setItem("subscribed", submitEmail.current)
      if (hideAfterSubscribe) {
        timer.current = setTimeout(() => {
          setHide(true)
        }, 2000)
      }
    },
    [executeRecaptcha, hideAfterSubscribe]
  )

  if (hide) {
    return null
  }
  return (
    <div className={`subscribe${hideAfterSubscribe ? " hideAfterSubscribe" : ""}`}>
      {children}
      <form className="subscribe" onSubmit={onSubmit}>
        <div>
          <input
            className="email"
            type="text"
            value={email}
            onChange={onChange}
            name="email"
            placeholder="your@email.com"
            disabled={session?.user?.email ? true : showSuccess}
          />
          <input className="submit" type="submit" value="Subscribe" disabled={!enabled} />
          <FaCheckCircle
            className="success"
            size={"1.4em"}
            style={{ display: "block", opacity: showSuccess ? 1 : 0 }}
          />
        </div>
      </form>
    </div>
  )
}
export default SubscribeButton
