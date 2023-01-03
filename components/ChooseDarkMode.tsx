import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { FaMoon, FaSun } from "react-icons/fa"

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
    typeof window !== "undefined" ? document.body.classList.contains("dark-mode") : false
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!text) {
    if (mounted && darkMode) {
      return <FaSun onClick={() => setDarkMode(false)} style={{ verticalAlign: "middle" }} />
    } else {
      return (
        <FaMoon
          onClick={() => setDarkMode(true)}
          style={{ verticalAlign: "middle", visibility: mounted ? "visible" : "hidden" }}
        />
      )
    }
  } else {
    if (mounted && darkMode) {
      return <span onClick={() => setDarkMode(false)}>Light Mode</span>
    } else {
      return (
        <span onClick={() => setDarkMode(true)} style={{ visibility: mounted ? "visible" : "hidden" }}>
          Dark Mode
        </span>
      )
    }
  }
}
export default ChooseDarkMode
