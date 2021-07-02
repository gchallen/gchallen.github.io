import { CSSProperties, useEffect, useState } from "react"
import { FaMoon, FaSun } from "react-icons/fa"
import useDarkMode from "use-dark-mode"

const ChooseDarkMode: React.FC<{ text?: boolean }> = ({ text }) => {
  const darkMode = useDarkMode(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const style = { visibility: mounted ? "visible" : "hidden" } as CSSProperties

  if (!text) {
    if (mounted && darkMode.value) {
      return <FaSun onClick={darkMode.disable} style={{ verticalAlign: "middle" }} />
    } else {
      return <FaMoon onClick={darkMode.enable} style={{ verticalAlign: "middle", ...style }} />
    }
  } else {
    if (mounted && darkMode.value) {
      return <span onClick={darkMode.disable}>Light Mode</span>
    } else {
      return (
        <span onClick={darkMode.enable} style={style}>
          Dark Mode
        </span>
      )
    }
  }
}
export default ChooseDarkMode
