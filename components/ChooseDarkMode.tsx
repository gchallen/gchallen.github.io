import { useEffect, useState } from "react"
import { FaMoon, FaSun } from "react-icons/fa"
import useDarkMode from "use-dark-mode"

const ChooseDarkMode: React.FC<{ text?: boolean }> = ({ text }) => {
  const darkMode = useDarkMode(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }
  if (!text) {
    if (darkMode.value) {
      return <FaSun onClick={darkMode.disable} style={{ verticalAlign: "middle" }} />
    } else {
      return <FaMoon onClick={darkMode.enable} style={{ verticalAlign: "middle" }} />
    }
  } else {
    if (darkMode.value) {
      return <span onClick={darkMode.disable}>Light Mode</span>
    } else {
      return <span onClick={darkMode.enable}>Dark Mode</span>
    }
  }
}
export default ChooseDarkMode
