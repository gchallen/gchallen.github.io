const storageKey = "darkMode"
const classNameDark = "dark-mode"
const classNameLight = "light-mode"

function setDarkModeOnDocumentBody(darkMode: boolean) {
  document.body.classList.add(darkMode ? classNameDark : classNameLight)
  document.body.classList.remove(darkMode ? classNameLight : classNameDark)
}

const preferDarkQuery = "(prefers-color-scheme: dark)"
const darkModeWindowQuery = window.matchMedia(preferDarkQuery)

const localStorageTheme = localStorage.getItem(storageKey)

if (localStorageTheme) {
  setDarkModeOnDocumentBody(JSON.parse(localStorageTheme))
} else if (darkModeWindowQuery.media === preferDarkQuery) {
  setDarkModeOnDocumentBody(darkModeWindowQuery.matches)
  localStorage.setItem(storageKey, JSON.stringify(darkModeWindowQuery.matches))
} else {
  localStorage.setItem(storageKey, JSON.stringify(document.body.classList.contains(classNameDark)))
}

if (localStorage.getItem("subscribed")) {
  document.body.classList.add("subscribed")
}
