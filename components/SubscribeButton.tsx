import validator from "email-validator"
import { useSession } from "next-auth/react"
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { FaCheckCircle } from "react-icons/fa"

interface SubscribeButtonContext {
  available: boolean
  show: boolean
}
const SubscribeButtonContext = createContext<SubscribeButtonContext>({
  available: false,
  show: false,
})

export const SubscribeButtonContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [show, setShow] = useState(true)

  useEffect(() => {
    fetch("https://lists.geoffreychallen.com/publisher/")
      .then((res) => res.json())
      .catch(() => setShow(false))
  }, [])

  return <SubscribeButtonContext.Provider value={{ available: true, show }}>{children}</SubscribeButtonContext.Provider>
}

export const useSubscribeButtonContext = () => useContext(SubscribeButtonContext)

const SubscribeButton: React.FC<PropsWithChildren & { center?: boolean; hideAfterSubscribe?: boolean }> = ({
  children,
  center = false,
  hideAfterSubscribe = false,
}) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const { data: session } = useSession()
  const sessionEmail = session?.user?.email || ""
  const [manualEmail, setManualEmail] = useState<string>("")
  const email = sessionEmail || manualEmail
  const submitEmail = useRef<string>(email)
  const [showSuccess, setShowSuccess] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { show } = useSubscribeButtonContext()
  const [hide, setHide] = useState(false)

  const enabled = validator.validate(email)

  useEffect(() => {
    submitEmail.current = email
  }, [email])

  const onChange = useCallback((event: any) => {
    setManualEmail(event.target.value)
  }, [])

  const onSubmit = useCallback(
    async (event: any) => {
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
    [executeRecaptcha, hideAfterSubscribe],
  )

  const actuallyShow = show === true && hide === false
  return (
    <div
      style={{
        maxHeight: actuallyShow ? 256 : 0,
        marginBottom: actuallyShow ? "1rem" : 0,
      }}
      className={`subscribe${hideAfterSubscribe ? " hideAfterSubscribe" : ""}${center ? " center" : ""}`}
    >
      <>
        {children}
        <form className={`subscribe${center ? " center" : ""}`} onSubmit={onSubmit}>
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
        </form>
      </>
    </div>
  )
}
export default SubscribeButton
