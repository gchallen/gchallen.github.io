import validator from "email-validator"
import { PropsWithChildren, useCallback, useRef, useState } from "react"
import { FaCheckCircle } from "react-icons/fa"

const SubscribeButton: React.FC<PropsWithChildren & { center?: boolean; hideAfterSubscribe?: boolean }> = ({
  children,
  center = false,
  hideAfterSubscribe = false,
}) => {
  const [email, setEmail] = useState("")
  const submitEmail = useRef(email)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hide, setHide] = useState(false)

  const enabled = validator.validate(email)

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    submitEmail.current = event.target.value
  }, [])

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: submitEmail.current }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus("success")
          setMessage(data.message || "Check your email for a confirmation link")
          if (hideAfterSubscribe) {
            timer.current = setTimeout(() => setHide(true), 4000)
          }
        } else {
          setStatus("error")
          setMessage(data.error || "Something went wrong")
        }
      } catch {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      }
    },
    [hideAfterSubscribe],
  )

  const show = !hide
  return (
    <div
      style={{
        maxHeight: show ? 256 : 0,
        marginBottom: show ? "1rem" : 0,
      }}
      className={`subscribe${hideAfterSubscribe ? " hideAfterSubscribe" : ""}${center ? " center" : ""}`}
    >
      <>
        {children}
        {status === "success" ? (
          <p style={{ display: "flex", alignItems: "center", gap: "0.4em" }}>
            <FaCheckCircle size={"1.2em"} /> {message}
          </p>
        ) : (
          <form className={`subscribe${center ? " center" : ""}`} onSubmit={onSubmit}>
            <input
              className="email"
              type="text"
              value={email}
              onChange={onChange}
              name="email"
              placeholder="your@email.com"
              disabled={false}
            />
            <input className="submit" type="submit" value="Subscribe" disabled={!enabled} />
          </form>
        )}
        {status === "error" && <p style={{ color: "red", fontSize: "0.9em" }}>{message}</p>}
      </>
    </div>
  )
}
export default SubscribeButton
