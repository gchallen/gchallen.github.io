import validator from "email-validator"
import { useCallback, useEffect, useState } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { FaCheckCircle } from "react-icons/fa"

const SubscribeButton = () => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [, setSubscriberCount] = useState()
  const [email, setEmail] = useState<string>("")
  const [enabled, setEnabled] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetch("https://lists.geoffreychallen.com/publisher/")
      .then((res) => res.json())
      .then(({ count }) => setSubscriberCount(count))
  }, [])

  const onChange = useCallback((event) => {
    setEmail(event.target.value)
    setEnabled(validator.validate(event.target.value))
  }, [])

  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      if (!executeRecaptcha) {
        return
      }
      const token = await executeRecaptcha("subscribe")
      setShowSuccess(true)
    },
    [executeRecaptcha]
  )

  return (
    <form className="subscribe" onSubmit={onSubmit}>
      <div>
        <input className="email" type="text" value={email} onChange={onChange} name="email" placeholder="your@email.com" />
        <input className="submit" type="submit" value="Subscribe" disabled={!enabled} />
        <FaCheckCircle className="success" size={"1.4em"} style={{ display: "block", opacity: showSuccess ? 1 : 0 }} />
      </div>
    </form>
  )
}
export default SubscribeButton
