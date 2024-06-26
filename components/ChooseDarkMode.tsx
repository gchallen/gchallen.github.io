import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { FaMoon, FaSun } from "react-icons/fa"
import { useHeaderContext } from "./Header"

export interface DarkModeContext {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
}
export const DarkModeContext = createContext<DarkModeContext>({
  darkMode: false,
  setDarkMode: () => {
    throw "DarkModeContext not available"
  },
})
export const DarkModeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    typeof window !== "undefined" ? document.body.classList.contains("dark-mode") : false,
  )

  useEffect(() => {
    document.body.classList.add(darkMode ? "dark-mode" : "light-mode")
    document.body.classList.remove(darkMode ? "light-mode" : "dark-mode")
    localStorage.setItem("darkMode", darkMode.toString())
  }, [darkMode])

  useEffect(() => {
    const onStorage = () => {
      const currentValue = document.body.classList.contains("dark-mode")
      const storageValue = localStorage.getItem("darkMode")
      const newValue = storageValue !== null ? JSON.parse(storageValue) : currentValue
      if (newValue !== currentValue) {
        setDarkMode(newValue)
      }
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>{children}</DarkModeContext.Provider>
}

export const useDarkMode = (): DarkModeContext => {
  return useContext(DarkModeContext)
}

const ChooseDarkMode: React.FC<{ text?: boolean }> = ({ text }) => {
  const { darkMode, setDarkMode } = useDarkMode()
  const { setOpen } = useHeaderContext()

  return (
    <div
      className="chooseDarkMode"
      onClick={() => {
        setDarkMode(!darkMode)
        setOpen(false)
      }}
    >
      <div className="choseLight">{text ? <span>Light Mode</span> : <FaSun style={{ verticalAlign: "middle" }} />}</div>
      <div className="choseDark">{text ? <span>Dark Mode</span> : <FaMoon style={{ verticalAlign: "middle" }} />}</div>
    </div>
  )
}
export default ChooseDarkMode
