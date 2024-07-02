"use strict";
(() => {
  // onload.ts
  var storageKey = "darkMode";
  var classNameDark = "dark-mode";
  var classNameLight = "light-mode";
  function setDarkModeOnDocumentBody(darkMode) {
    document.body.classList.add(darkMode ? classNameDark : classNameLight);
    document.body.classList.remove(darkMode ? classNameLight : classNameDark);
  }
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var darkModeWindowQuery = window.matchMedia(preferDarkQuery);
  var localStorageTheme = localStorage.getItem(storageKey);
  if (localStorageTheme) {
    setDarkModeOnDocumentBody(JSON.parse(localStorageTheme));
  } else if (darkModeWindowQuery.media === preferDarkQuery) {
    setDarkModeOnDocumentBody(darkModeWindowQuery.matches);
    localStorage.setItem(storageKey, JSON.stringify(darkModeWindowQuery.matches));
  } else {
    localStorage.setItem(storageKey, JSON.stringify(document.body.classList.contains(classNameDark)));
  }
  if (localStorage.getItem("subscribed")) {
    document.body.classList.add("subscribed");
  }
})();
